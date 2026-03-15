from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, timedelta
from decimal import Decimal
import logging
import secrets
import string

from src.models.merchandise import (
    MerchandiseItem,
    MerchandiseOrder,
    MerchandiseOrderItem,
    MerchandiseCommission
)
from src.models.branding import InstitutionBranding
from src.schemas.merchandise import (
    MerchandiseItemCreate,
    MerchandiseItemUpdate,
    MerchandiseOrderCreate,
    OrderItemCreate,
    MerchandiseOrderUpdate
)
from src.services.printful_service import PrintfulService
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class MerchandiseService:
    def __init__(self, db: Session, printful_api_key: Optional[str] = None):
        self.db = db
        self.printful_service = PrintfulService(printful_api_key) if printful_api_key else None
    
    def generate_order_number(self) -> str:
        """Generate unique order number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_part = ''.join(secrets.choice(string.digits) for _ in range(6))
        return f"MERCH-{timestamp}-{random_part}"
    
    def create_merchandise_item(
        self,
        item_data: MerchandiseItemCreate
    ) -> MerchandiseItem:
        """Create a new merchandise item"""
        db_item = MerchandiseItem(**item_data.model_dump())
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item
    
    def get_merchandise_item(
        self,
        item_id: int,
        institution_id: int
    ) -> Optional[MerchandiseItem]:
        """Get merchandise item by ID"""
        return self.db.query(MerchandiseItem).filter(
            and_(
                MerchandiseItem.id == item_id,
                MerchandiseItem.institution_id == institution_id
            )
        ).first()
    
    def list_merchandise_items(
        self,
        institution_id: int,
        category: Optional[str] = None,
        is_active: Optional[bool] = True,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[MerchandiseItem], int]:
        """List merchandise items with filters"""
        query = self.db.query(MerchandiseItem).filter(
            MerchandiseItem.institution_id == institution_id
        )
        
        if category:
            query = query.filter(MerchandiseItem.category == category)
        
        if is_active is not None:
            query = query.filter(MerchandiseItem.is_active == is_active)
        
        total = query.count()
        items = query.order_by(desc(MerchandiseItem.created_at)).offset(skip).limit(limit).all()
        
        return items, total
    
    def update_merchandise_item(
        self,
        item_id: int,
        institution_id: int,
        item_data: MerchandiseItemUpdate
    ) -> Optional[MerchandiseItem]:
        """Update merchandise item"""
        db_item = self.get_merchandise_item(item_id, institution_id)
        if not db_item:
            return None
        
        update_data = item_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
        
        self.db.commit()
        self.db.refresh(db_item)
        return db_item
    
    def delete_merchandise_item(
        self,
        item_id: int,
        institution_id: int
    ) -> bool:
        """Delete merchandise item"""
        db_item = self.get_merchandise_item(item_id, institution_id)
        if not db_item:
            return False
        
        self.db.delete(db_item)
        self.db.commit()
        return True
    
    async def generate_mockup(
        self,
        item_id: int,
        institution_id: int,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
        secondary_color: Optional[str] = None,
        text_overlay: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate branded mockup images using Printful"""
        if not self.printful_service:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Printful service not configured"
            )
        
        item = self.get_merchandise_item(item_id, institution_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Merchandise item not found"
            )
        
        # Get institution branding if not provided
        if not logo_url or not primary_color:
            branding = self.db.query(InstitutionBranding).filter(
                InstitutionBranding.institution_id == institution_id
            ).first()
            
            if branding:
                logo_url = logo_url or branding.logo_url
                primary_color = primary_color or branding.primary_color
                secondary_color = secondary_color or branding.secondary_color
        
        # Prepare files for mockup generation
        files = []
        if logo_url:
            files.append({
                "type": "default",
                "url": logo_url,
                "position": {
                    "area_width": 1800,
                    "area_height": 2400,
                    "width": 1800,
                    "height": 1800,
                    "top": 300,
                    "left": 0
                }
            })
        
        # Generate mockup
        variant_ids = [int(item.product_template_id)] if item.product_template_id else []
        mockup_result = await self.printful_service.create_mockup(
            variant_ids=variant_ids,
            files=files,
            options={"background_color": primary_color} if primary_color else None
        )
        
        # Store mockup URLs
        if mockup_result.get("code") == 200:
            mockup_images = {}
            for mockup in mockup_result.get("result", {}).get("mockups", []):
                placement = mockup.get("placement", "default")
                mockup_images[placement] = mockup.get("mockup_url")
            
            item.mockup_images = mockup_images
            self.db.commit()
            
            return {
                "merchandise_item_id": item_id,
                "mockup_urls": mockup_images,
                "generated_at": datetime.utcnow()
            }
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate mockup"
        )
    
    def calculate_order_totals(
        self,
        items_data: List[OrderItemCreate],
        institution_id: int
    ) -> Dict[str, Decimal]:
        """Calculate order subtotal, tax, shipping, and total"""
        subtotal = Decimal("0.00")
        
        for item_data in items_data:
            merchandise_item = self.get_merchandise_item(
                item_data.merchandise_item_id,
                institution_id
            )
            if not merchandise_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Merchandise item {item_data.merchandise_item_id} not found"
                )
            
            if not merchandise_item.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item {merchandise_item.item_name} is not available"
                )
            
            item_total = merchandise_item.base_price * item_data.quantity
            subtotal += item_total
        
        # Calculate tax (18% GST for India)
        tax_amount = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"))
        
        # Flat shipping cost (this could be dynamic based on Printful)
        shipping_cost = Decimal("100.00") if subtotal > 0 else Decimal("0.00")
        
        # Free shipping over certain amount
        if subtotal >= Decimal("1000.00"):
            shipping_cost = Decimal("0.00")
        
        total_amount = subtotal + tax_amount + shipping_cost
        
        return {
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "shipping_cost": shipping_cost,
            "total_amount": total_amount
        }
    
    def create_order(
        self,
        order_data: MerchandiseOrderCreate,
        institution_id: int,
        user_id: Optional[int] = None,
        commission_percentage: Decimal = Decimal("10.00")
    ) -> MerchandiseOrder:
        """Create a new merchandise order"""
        # Calculate totals
        totals = self.calculate_order_totals(order_data.items, institution_id)
        
        # Calculate commission
        commission_amount = (totals["subtotal"] * commission_percentage / 100).quantize(Decimal("0.01"))
        
        # Create order
        order_number = self.generate_order_number()
        
        shipping_data = order_data.shipping_address.model_dump()
        
        db_order = MerchandiseOrder(
            institution_id=institution_id,
            user_id=user_id,
            order_number=order_number,
            buyer_name=order_data.buyer_name,
            buyer_email=order_data.buyer_email,
            buyer_phone=order_data.buyer_phone,
            **shipping_data,
            subtotal=totals["subtotal"],
            tax_amount=totals["tax_amount"],
            shipping_cost=totals["shipping_cost"],
            total_amount=totals["total_amount"],
            customization=order_data.customization,
            notes=order_data.notes,
            commission_percentage=commission_percentage,
            commission_amount=commission_amount
        )
        
        self.db.add(db_order)
        self.db.flush()
        
        # Create order items
        for item_data in order_data.items:
            merchandise_item = self.get_merchandise_item(
                item_data.merchandise_item_id,
                institution_id
            )
            
            unit_price = merchandise_item.base_price
            total_price = unit_price * item_data.quantity
            
            order_item = MerchandiseOrderItem(
                order_id=db_order.id,
                merchandise_item_id=item_data.merchandise_item_id,
                item_name=merchandise_item.item_name,
                category=merchandise_item.category,
                size=item_data.size,
                color=item_data.color,
                quantity=item_data.quantity,
                unit_price=unit_price,
                total_price=total_price,
                personalization=item_data.personalization
            )
            self.db.add(order_item)
            
            # Update inventory if tracking
            if merchandise_item.inventory_tracking:
                merchandise_item.stock_quantity -= item_data.quantity
        
        self.db.commit()
        self.db.refresh(db_order)
        
        return db_order
    
    def get_order(
        self,
        order_id: int,
        institution_id: int
    ) -> Optional[MerchandiseOrder]:
        """Get order by ID"""
        return self.db.query(MerchandiseOrder).filter(
            and_(
                MerchandiseOrder.id == order_id,
                MerchandiseOrder.institution_id == institution_id
            )
        ).first()
    
    def get_order_by_number(
        self,
        order_number: str,
        institution_id: Optional[int] = None
    ) -> Optional[MerchandiseOrder]:
        """Get order by order number"""
        query = self.db.query(MerchandiseOrder).filter(
            MerchandiseOrder.order_number == order_number
        )
        
        if institution_id:
            query = query.filter(MerchandiseOrder.institution_id == institution_id)
        
        return query.first()
    
    def list_orders(
        self,
        institution_id: int,
        user_id: Optional[int] = None,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[MerchandiseOrder], int]:
        """List orders with filters"""
        query = self.db.query(MerchandiseOrder).filter(
            MerchandiseOrder.institution_id == institution_id
        )
        
        if user_id:
            query = query.filter(MerchandiseOrder.user_id == user_id)
        
        if order_status:
            query = query.filter(MerchandiseOrder.order_status == order_status)
        
        if payment_status:
            query = query.filter(MerchandiseOrder.payment_status == payment_status)
        
        total = query.count()
        orders = query.order_by(desc(MerchandiseOrder.created_at)).offset(skip).limit(limit).all()
        
        return orders, total
    
    def update_order(
        self,
        order_id: int,
        institution_id: int,
        order_data: MerchandiseOrderUpdate
    ) -> Optional[MerchandiseOrder]:
        """Update order"""
        db_order = self.get_order(order_id, institution_id)
        if not db_order:
            return None
        
        update_data = order_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_order, field, value)
        
        # Update status timestamps
        if "order_status" in update_data:
            if update_data["order_status"] == "shipped" and not db_order.shipped_at:
                db_order.shipped_at = datetime.utcnow()
            elif update_data["order_status"] == "delivered" and not db_order.delivered_at:
                db_order.delivered_at = datetime.utcnow()
            elif update_data["order_status"] == "canceled" and not db_order.canceled_at:
                db_order.canceled_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_order)
        return db_order
    
    def update_payment_status(
        self,
        order_id: int,
        payment_status: str,
        razorpay_payment_id: Optional[str] = None,
        razorpay_signature: Optional[str] = None
    ) -> Optional[MerchandiseOrder]:
        """Update order payment status"""
        db_order = self.db.query(MerchandiseOrder).filter(
            MerchandiseOrder.id == order_id
        ).first()
        
        if not db_order:
            return None
        
        db_order.payment_status = payment_status
        
        if razorpay_payment_id:
            db_order.razorpay_payment_id = razorpay_payment_id
        
        if razorpay_signature:
            db_order.razorpay_signature = razorpay_signature
        
        if payment_status == "captured":
            db_order.paid_at = datetime.utcnow()
            db_order.order_status = "confirmed"
            db_order.confirmed_at = datetime.utcnow()
            
            # Create commission record
            commission = MerchandiseCommission(
                institution_id=db_order.institution_id,
                order_id=db_order.id,
                order_total=db_order.total_amount,
                commission_percentage=db_order.commission_percentage,
                commission_amount=db_order.commission_amount,
                currency=db_order.currency
            )
            self.db.add(commission)
        
        self.db.commit()
        self.db.refresh(db_order)
        return db_order
    
    async def submit_to_printful(
        self,
        order_id: int,
        institution_id: int
    ) -> Dict[str, Any]:
        """Submit order to Printful for fulfillment"""
        if not self.printful_service:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Printful service not configured"
            )
        
        order = self.get_order(order_id, institution_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.payment_status != "captured":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order payment not confirmed"
            )
        
        # Format recipient
        recipient = self.printful_service.format_recipient(
            name=order.shipping_name,
            address1=order.shipping_address_line1,
            address2=order.shipping_address_line2,
            city=order.shipping_city,
            state_code=order.shipping_state,
            country_code=order.shipping_country[:2].upper(),
            zip_code=order.shipping_postal_code,
            email=order.buyer_email,
            phone=order.buyer_phone
        )
        
        # Format items
        printful_items = []
        for item in order.items:
            if item.merchandise_item.product_template_id:
                printful_item = self.printful_service.format_item(
                    variant_id=int(item.merchandise_item.product_template_id),
                    quantity=item.quantity
                )
                printful_items.append(printful_item)
        
        # Create order in Printful
        order_data = self.printful_service.format_order_for_printful(
            order_number=order.order_number,
            recipient=recipient,
            items=printful_items,
            retail_costs={
                "subtotal": str(order.subtotal),
                "tax": str(order.tax_amount),
                "shipping": str(order.shipping_cost)
            }
        )
        
        result = await self.printful_service.create_order(order_data)
        
        if result.get("code") == 200:
            printful_order = result.get("result")
            order.printful_order_id = str(printful_order.get("id"))
            order.order_status = "production"
            self.db.commit()
            
            return printful_order
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit order to Printful"
        )
    
    def get_commission_report(
        self,
        institution_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate commission report for institution"""
        orders = self.db.query(MerchandiseOrder).filter(
            and_(
                MerchandiseOrder.institution_id == institution_id,
                MerchandiseOrder.created_at >= start_date,
                MerchandiseOrder.created_at <= end_date,
                MerchandiseOrder.payment_status == "captured"
            )
        ).all()
        
        total_orders = len(orders)
        total_sales = sum(order.total_amount for order in orders)
        total_commission = sum(order.commission_amount for order in orders)
        
        pending_commission = sum(
            order.commission_amount
            for order in orders
            if not order.commission_paid
        )
        
        paid_commission = sum(
            order.commission_amount
            for order in orders
            if order.commission_paid
        )
        
        return {
            "institution_id": institution_id,
            "total_orders": total_orders,
            "total_sales": total_sales,
            "total_commission": total_commission,
            "pending_commission": pending_commission,
            "paid_commission": paid_commission,
            "currency": "INR",
            "period_start": start_date,
            "period_end": end_date
        }
