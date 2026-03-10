#!/usr/bin/env python3
"""
Subscription Scheduler Script

This script runs periodic tasks for subscription management:
- Check for subscriptions due for renewal
- Send renewal reminders
- Process expired trials
- Process expired grace periods
- Check for overdue invoices

Usage:
    python scripts/subscription_scheduler.py

This script should be run as a cron job or scheduled task.
Recommended schedule: Every hour or every 6 hours depending on business needs.
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
import logging

from src.utils.subscription_tasks import run_subscription_tasks

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/subscription_scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Starting subscription scheduler tasks...")
    
    try:
        results = run_subscription_tasks()
        
        logger.info("Subscription scheduler tasks completed successfully")
        logger.info(f"Timestamp: {results['timestamp']}")
        logger.info(f"Renewal reminders sent: {len(results['renewal_reminders'])}")
        logger.info(f"Expired trials processed: {len(results['expired_trials'])}")
        logger.info(f"Expired grace periods processed: {len(results['expired_grace_periods'])}")
        logger.info(f"Upcoming renewals processed: {len(results['upcoming_renewals'])}")
        logger.info(f"Overdue invoices marked: {len(results['overdue_invoices'])}")
        
        for reminder in results['renewal_reminders']:
            logger.info(
                f"Renewal reminder - Subscription ID: {reminder['subscription_id']}, "
                f"Institution ID: {reminder['institution_id']}, "
                f"Days until renewal: {reminder['days_until_renewal']}"
            )
        
        for trial in results['expired_trials']:
            logger.info(
                f"Expired trial - Subscription ID: {trial['subscription_id']}, "
                f"Institution ID: {trial['institution_id']}, "
                f"Action: {trial['action']}, Status: {trial['status']}"
            )
        
        for grace in results['expired_grace_periods']:
            logger.info(
                f"Expired grace period - Subscription ID: {grace['subscription_id']}, "
                f"Institution ID: {grace['institution_id']}, "
                f"Status: {grace['status']}"
            )
        
        for renewal in results['upcoming_renewals']:
            logger.info(
                f"Upcoming renewal - Subscription ID: {renewal['subscription_id']}, "
                f"Institution ID: {renewal['institution_id']}, "
                f"Action: {renewal['action']}, Status: {renewal['status']}"
            )
        
        for invoice in results['overdue_invoices']:
            logger.info(
                f"Overdue invoice - Invoice ID: {invoice['invoice_id']}, "
                f"Subscription ID: {invoice['subscription_id']}, "
                f"Institution ID: {invoice['institution_id']}"
            )
        
    except Exception as e:
        logger.error(f"Error running subscription scheduler tasks: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
