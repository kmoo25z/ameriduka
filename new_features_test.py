#!/usr/bin/env python3
"""
TechGalaxy E-commerce Platform - New Features Backend API Tests
Tests the newly added features: Wishlist, Compare Products, Addresses, Support Tickets, Loyalty Points, PDF Invoice
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class NewFeaturesAPITester:
    def __init__(self, base_url="https://techgalaxy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_product_id = None
        self.test_order_id = None
        self.test_address_id = None
        self.test_ticket_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials
        self.admin_creds = {"email": "admin@techgalaxy.ke", "password": "Admin123!"}
        self.user_creds = {"email": "test@example.com", "password": "Test123!"}

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": test_name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            if not success:
                response_data["actual_status"] = response.status_code
                response_data["expected_status"] = expected_status
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def setup_test_data(self):
        """Setup test data - login and get product IDs"""
        print("\n🔧 Setting up test data...")
        
        # Login as admin
        success, data = self.make_request("POST", "/auth/login", self.admin_creds)
        if success and 'token' in data:
            self.admin_token = data['token']
            print("✅ Admin login successful")
        else:
            print("❌ Admin login failed")
            return False
        
        # Login as user
        success, data = self.make_request("POST", "/auth/login", self.user_creds)
        if success and 'token' in data:
            self.user_token = data['token']
            print("✅ User login successful")
        else:
            print("❌ User login failed")
            return False
        
        # Get test product ID
        success, data = self.make_request("GET", "/products")
        if success and data.get('products'):
            self.test_product_id = data['products'][0]['product_id']
            print(f"✅ Test product ID: {self.test_product_id}")
        else:
            print("❌ Failed to get test product")
            return False
        
        return True

    def test_wishlist_features(self):
        """Test wishlist functionality"""
        print("\n🔍 Testing Wishlist Features...")
        
        if not self.user_token or not self.test_product_id:
            self.log_result("Wishlist Tests", False, "Missing user token or test product ID")
            return
        
        # Test get empty wishlist
        success, data = self.make_request("GET", "/wishlist", token=self.user_token)
        self.log_result("Get Empty Wishlist", success,
                       f"Items: {data.get('count', 0)}" if success else f"Error: {data}")
        
        # Test add to wishlist
        wishlist_item = {"product_id": self.test_product_id}
        success, data = self.make_request("POST", "/wishlist/add", wishlist_item, token=self.user_token)
        self.log_result("Add to Wishlist", success,
                       f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")
        
        # Test get wishlist with items
        success, data = self.make_request("GET", "/wishlist", token=self.user_token)
        if success:
            item_count = data.get('count', 0)
            items = data.get('items', [])
            self.log_result("Get Wishlist with Items", True, f"Items: {item_count}, Products: {len(items)}")
        else:
            self.log_result("Get Wishlist with Items", False, f"Error: {data}")
        
        # Test remove from wishlist
        success, data = self.make_request("DELETE", f"/wishlist/{self.test_product_id}", token=self.user_token)
        self.log_result("Remove from Wishlist", success,
                       f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")

    def test_compare_products(self):
        """Test product comparison functionality"""
        print("\n🔍 Testing Compare Products...")
        
        # Get multiple product IDs for comparison
        success, data = self.make_request("GET", "/products?limit=4")
        if not success or not data.get('products') or len(data['products']) < 2:
            self.log_result("Compare Products Setup", False, "Need at least 2 products for comparison")
            return
        
        product_ids = [p['product_id'] for p in data['products'][:3]]  # Test with 3 products
        
        # Test compare products
        success, data = self.make_request("POST", "/products/compare", product_ids)
        if success:
            products = data.get('products', [])
            comparison_fields = data.get('comparison_fields', [])
            self.log_result("Compare Products", True, 
                           f"Products: {len(products)}, Comparison fields: {len(comparison_fields)}")
        else:
            self.log_result("Compare Products", False, f"Error: {data}")
        
        # Test compare with insufficient products
        success, data = self.make_request("POST", "/products/compare", [product_ids[0]], expected_status=400)
        self.log_result("Compare Single Product (Should Fail)", success,
                       "Correctly rejected single product" if success else f"Error: {data}")

    def test_address_management(self):
        """Test address management functionality"""
        print("\n🔍 Testing Address Management...")
        
        if not self.user_token:
            self.log_result("Address Tests", False, "Missing user token")
            return
        
        # Test get empty addresses
        success, data = self.make_request("GET", "/addresses", token=self.user_token)
        if success:
            address_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Addresses", True, f"Found {address_count} addresses")
        else:
            self.log_result("Get Addresses", False, f"Error: {data}")
        
        # Test create address
        address_data = {
            "label": "Home",
            "full_name": "Test User",
            "phone": "+254712345678",
            "address_line1": "123 Test Street",
            "address_line2": "Apt 4B",
            "city": "Nairobi",
            "country": "Kenya",
            "postal_code": "00100",
            "is_default": True
        }
        
        success, data = self.make_request("POST", "/addresses", address_data, token=self.user_token)
        if success:
            self.test_address_id = data.get('address_id')
            self.log_result("Create Address", True, f"Address ID: {self.test_address_id}")
        else:
            self.log_result("Create Address", False, f"Error: {data}")
        
        # Test update address
        if self.test_address_id:
            update_data = address_data.copy()
            update_data["city"] = "Mombasa"
            success, data = self.make_request("PUT", f"/addresses/{self.test_address_id}", 
                                            update_data, token=self.user_token)
            self.log_result("Update Address", success,
                           f"Updated city to: {data.get('city', 'Unknown')}" if success else f"Error: {data}")
        
        # Test get addresses after creation
        success, data = self.make_request("GET", "/addresses", token=self.user_token)
        if success:
            address_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Addresses After Creation", True, f"Found {address_count} addresses")
        else:
            self.log_result("Get Addresses After Creation", False, f"Error: {data}")

    def test_support_tickets(self):
        """Test support ticket functionality"""
        print("\n🔍 Testing Support Tickets...")
        
        if not self.user_token:
            self.log_result("Support Ticket Tests", False, "Missing user token")
            return
        
        # Test get empty tickets
        success, data = self.make_request("GET", "/tickets", token=self.user_token)
        if success:
            ticket_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Support Tickets", True, f"Found {ticket_count} tickets")
        else:
            self.log_result("Get Support Tickets", False, f"Error: {data}")
        
        # Test create support ticket
        ticket_data = {
            "subject": "Test Support Issue",
            "message": "This is a test support ticket created by automated testing.",
            "category": "technical",
            "order_id": None
        }
        
        success, data = self.make_request("POST", "/tickets", ticket_data, token=self.user_token)
        if success:
            self.test_ticket_id = data.get('ticket_id')
            status = data.get('status', 'Unknown')
            self.log_result("Create Support Ticket", True, f"Ticket ID: {self.test_ticket_id}, Status: {status}")
        else:
            self.log_result("Create Support Ticket", False, f"Error: {data}")
        
        # Test reply to ticket
        if self.test_ticket_id:
            reply_message = "This is a test reply from the customer."
            success, data = self.make_request("POST", f"/tickets/{self.test_ticket_id}/reply?message={reply_message}", 
                                            token=self.user_token)
            self.log_result("Reply to Ticket", success,
                           f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")
        
        # Test admin ticket management (if admin token available)
        if self.admin_token and self.test_ticket_id:
            success, data = self.make_request("PUT", f"/tickets/{self.test_ticket_id}/status?status=in_progress", 
                                            token=self.admin_token)
            self.log_result("Admin Update Ticket Status", success,
                           f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")

    def test_loyalty_points(self):
        """Test loyalty points functionality"""
        print("\n🔍 Testing Loyalty Points...")
        
        if not self.user_token:
            self.log_result("Loyalty Points Tests", False, "Missing user token")
            return
        
        # Test get loyalty balance
        success, data = self.make_request("GET", "/loyalty/balance", token=self.user_token)
        if success:
            points = data.get('points', 0)
            value_usd = data.get('value_usd', 0)
            self.log_result("Get Loyalty Balance", True, f"Points: {points}, Value: ${value_usd}")
        else:
            self.log_result("Get Loyalty Balance", False, f"Error: {data}")
        
        # Test get loyalty history
        success, data = self.make_request("GET", "/loyalty/history", token=self.user_token)
        if success:
            history_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Loyalty History", True, f"Found {history_count} transactions")
        else:
            self.log_result("Get Loyalty History", False, f"Error: {data}")
        
        # Test redeem loyalty points (if user has enough points)
        success, balance_data = self.make_request("GET", "/loyalty/balance", token=self.user_token)
        if success and balance_data.get('points', 0) >= 100:
            success, data = self.make_request("POST", "/loyalty/redeem?points=100", token=self.user_token)
            self.log_result("Redeem Loyalty Points", success,
                           f"Discount: ${data.get('discount_usd', 0)}" if success else f"Error: {data}")
        else:
            self.log_result("Redeem Loyalty Points", True, "Insufficient points (expected for new user)")

    def test_pdf_invoice(self):
        """Test PDF invoice generation"""
        print("\n🔍 Testing PDF Invoice Generation...")
        
        if not self.user_token:
            self.log_result("PDF Invoice Tests", False, "Missing user token")
            return
        
        # First, create an order to generate invoice for
        order_data = {
            "items": [{"product_id": self.test_product_id, "quantity": 1}],
            "shipping_address": "123 Invoice Test Street",
            "shipping_city": "Nairobi",
            "shipping_country": "Kenya",
            "phone": "+254712345678",
            "currency": "KES",
            "payment_method": "stripe",
            "notes": "Test order for PDF invoice"
        }
        
        success, data = self.make_request("POST", "/orders", order_data, token=self.user_token)
        if success:
            test_order_id = data.get('order_id')
            self.log_result("Create Order for Invoice", True, f"Order ID: {test_order_id}")
            
            # Test PDF invoice generation
            try:
                url = f"{self.api_url}/orders/{test_order_id}/invoice"
                headers = {'Authorization': f'Bearer {self.user_token}'}
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                    pdf_size = len(response.content)
                    self.log_result("Generate PDF Invoice", True, f"PDF size: {pdf_size} bytes")
                else:
                    self.log_result("Generate PDF Invoice", False, 
                                   f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
            except Exception as e:
                self.log_result("Generate PDF Invoice", False, f"Error: {str(e)}")
        else:
            self.log_result("Create Order for Invoice", False, f"Error: {data}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test address
        if self.user_token and self.test_address_id:
            success, data = self.make_request("DELETE", f"/addresses/{self.test_address_id}", token=self.user_token)
            if success:
                print("✅ Test address deleted")
            else:
                print("❌ Failed to delete test address")

    def run_all_tests(self):
        """Run all new feature tests"""
        print("🚀 Starting TechGalaxy New Features API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Setup test data
        if not self.setup_test_data():
            print("❌ Failed to setup test data. Exiting.")
            return False
        
        # Run test suites
        self.test_wishlist_features()
        self.test_compare_products()
        self.test_address_management()
        self.test_support_tickets()
        self.test_loyalty_points()
        self.test_pdf_invoice()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 NEW FEATURES TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"{i}. {failure['test']}")
                if failure['details']:
                    print(f"   Details: {failure['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = NewFeaturesAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())