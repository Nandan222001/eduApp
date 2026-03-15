from typing import Dict, Any, List, Optional
import httpx
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class PrintfulService:
    BASE_URL = "https://api.printful.com"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_product_catalog(self, category_id: Optional[int] = None) -> Dict[str, Any]:
        """Get Printful product catalog"""
        url = f"{self.BASE_URL}/products"
        if category_id:
            url += f"?category_id={category_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching Printful catalog: {e}")
                raise
    
    async def get_product_details(self, product_id: int) -> Dict[str, Any]:
        """Get details of a specific product"""
        url = f"{self.BASE_URL}/products/{product_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching product details: {e}")
                raise
    
    async def get_variant_info(self, product_id: int) -> Dict[str, Any]:
        """Get variant information for a product"""
        url = f"{self.BASE_URL}/products/{product_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching variant info: {e}")
                raise
    
    async def create_mockup(
        self,
        variant_ids: List[int],
        files: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate mockup images with branding"""
        url = f"{self.BASE_URL}/mockup-generator/create-task/{variant_ids[0]}"
        
        payload = {
            "variant_ids": variant_ids,
            "format": "jpg",
            "files": files
        }
        
        if options:
            payload["options"] = options
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers, json=payload)
                response.raise_for_status()
                result = response.json()
                
                if result.get("code") == 200:
                    task_key = result["result"]["task_key"]
                    return await self.get_mockup_task(task_key)
                
                return result
            except httpx.HTTPError as e:
                logger.error(f"Error creating mockup: {e}")
                raise
    
    async def get_mockup_task(self, task_key: str) -> Dict[str, Any]:
        """Get mockup generation task result"""
        url = f"{self.BASE_URL}/mockup-generator/task"
        params = {"task_key": task_key}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching mockup task: {e}")
                raise
    
    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an order in Printful for fulfillment"""
        url = f"{self.BASE_URL}/orders"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=self.headers, json=order_data)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error creating Printful order: {e}")
                raise
    
    async def confirm_order(self, order_id: str) -> Dict[str, Any]:
        """Confirm a Printful order for production"""
        url = f"{self.BASE_URL}/orders/{order_id}/confirm"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error confirming Printful order: {e}")
                raise
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status from Printful"""
        url = f"{self.BASE_URL}/orders/{order_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching order status: {e}")
                raise
    
    async def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """Cancel a Printful order"""
        url = f"{self.BASE_URL}/orders/{order_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error canceling order: {e}")
                raise
    
    async def calculate_shipping(
        self,
        recipient: Dict[str, str],
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate shipping costs for an order"""
        url = f"{self.BASE_URL}/shipping/rates"
        
        payload = {
            "recipient": recipient,
            "items": items
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error calculating shipping: {e}")
                raise
    
    async def get_tax_rate(
        self,
        recipient: Dict[str, str]
    ) -> Dict[str, Any]:
        """Get tax rate for shipping address"""
        url = f"{self.BASE_URL}/tax/rates"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers, json={"recipient": recipient})
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Error fetching tax rate: {e}")
                raise
    
    def format_order_for_printful(
        self,
        order_number: str,
        recipient: Dict[str, str],
        items: List[Dict[str, Any]],
        retail_costs: Optional[Dict[str, Decimal]] = None
    ) -> Dict[str, Any]:
        """Format order data for Printful API"""
        return {
            "external_id": order_number,
            "recipient": recipient,
            "items": items,
            "retail_costs": retail_costs or {}
        }
    
    def format_recipient(
        self,
        name: str,
        address1: str,
        city: str,
        state_code: str,
        country_code: str,
        zip_code: str,
        address2: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, str]:
        """Format recipient data for Printful"""
        recipient = {
            "name": name,
            "address1": address1,
            "city": city,
            "state_code": state_code,
            "country_code": country_code,
            "zip": zip_code
        }
        
        if address2:
            recipient["address2"] = address2
        if email:
            recipient["email"] = email
        if phone:
            recipient["phone"] = phone
        
        return recipient
    
    def format_item(
        self,
        variant_id: int,
        quantity: int,
        files: Optional[List[Dict[str, Any]]] = None,
        options: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Format item data for Printful"""
        item = {
            "variant_id": variant_id,
            "quantity": quantity
        }
        
        if files:
            item["files"] = files
        if options:
            item["options"] = options
        
        return item
