#!/usr/bin/env python3
"""
TechGalaxy E-commerce Platform Backend API Tests
Tests all major API endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TechGalaxyAPITester:
    def __init__(self, base_url="https://techgalaxy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_product_id = None
        self.test_order_id = None
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

    def test_health_check(self):
        """Test API health endpoints"""
        print("\n🔍 Testing Health Check Endpoints...")
        
        # Test root endpoint
        success, data = self.make_request("GET", "/")
        self.log_result("API Root Endpoint", success, 
                       f"Response: {data.get('message', 'No message')}" if success else f"Error: {data}")
        
        # Test health endpoint
        success, data = self.make_request("GET", "/health")
        self.log_result("Health Check Endpoint", success,
                       f"Status: {data.get('status', 'Unknown')}" if success else f"Error: {data}")

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Test admin login
        success, data = self.make_request("POST", "/auth/login", self.admin_creds)
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log_result("Admin Login", True, f"Role: {data.get('user', {}).get('role', 'Unknown')}")
        else:
            self.log_result("Admin Login", False, f"Error: {data}")
        
        # Test user login
        success, data = self.make_request("POST", "/auth/login", self.user_creds)
        if success and 'token' in data:
            self.user_token = data['token']
            self.log_result("User Login", True, f"Role: {data.get('user', {}).get('role', 'Unknown')}")
        else:
            self.log_result("User Login", False, f"Error: {data}")
        
        # Test get current user (admin)
        if self.admin_token:
            success, data = self.make_request("GET", "/auth/me", token=self.admin_token)
            self.log_result("Get Admin Profile", success,
                           f"Name: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # Test get current user (regular user)
        if self.user_token:
            success, data = self.make_request("GET", "/auth/me", token=self.user_token)
            self.log_result("Get User Profile", success,
                           f"Name: {data.get('name', 'Unknown')}" if success else f"Error: {data}")

    def test_products(self):
        """Test product endpoints"""
        print("\n🔍 Testing Product Endpoints...")
        
        # Test get all products
        success, data = self.make_request("GET", "/products")
        if success:
            product_count = len(data.get('products', []))
            self.log_result("Get All Products", True, f"Found {product_count} products")
            if product_count > 0:
                self.test_product_id = data['products'][0]['product_id']
        else:
            self.log_result("Get All Products", False, f"Error: {data}")
        
        # Test get featured products
        success, data = self.make_request("GET", "/products/featured")
        if success:
            featured_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Featured Products", True, f"Found {featured_count} featured products")
        else:
            self.log_result("Get Featured Products", False, f"Error: {data}")
        
        # Test get categories
        success, data = self.make_request("GET", "/products/categories")
        if success:
            category_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Categories", True, f"Found {category_count} categories")
        else:
            self.log_result("Get Categories", False, f"Error: {data}")
        
        # Test get brands
        success, data = self.make_request("GET", "/products/brands")
        if success:
            brand_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Brands", True, f"Found {brand_count} brands")
        else:
            self.log_result("Get Brands", False, f"Error: {data}")
        
        # Test get specific product
        if self.test_product_id:
            success, data = self.make_request("GET", f"/products/{self.test_product_id}")
            self.log_result("Get Product Details", success,
                           f"Product: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # Test product search with filters
        success, data = self.make_request("GET", "/products?category=phones&limit=5")
        if success:
            phone_count = len(data.get('products', []))
            self.log_result("Search Products (Phones)", True, f"Found {phone_count} phones")
        else:
            self.log_result("Search Products (Phones)", False, f"Error: {data}")

    def test_cart_operations(self):
        """Test cart operations"""
        print("\n🔍 Testing Cart Operations...")
        
        if not self.user_token or not self.test_product_id:
            self.log_result("Cart Tests", False, "Missing user token or test product ID")
            return
        
        # Test get empty cart
        success, data = self.make_request("GET", "/cart", token=self.user_token)
        self.log_result("Get Empty Cart", success,
                       f"Items: {len(data.get('items', []))}" if success else f"Error: {data}")
        
        # Test add to cart
        cart_item = {"product_id": self.test_product_id, "quantity": 2}
        success, data = self.make_request("POST", "/cart/add", cart_item, token=self.user_token)
        self.log_result("Add to Cart", success,
                       f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")
        
        # Test get cart with items
        success, data = self.make_request("GET", "/cart", token=self.user_token)
        if success:
            item_count = len(data.get('items', []))
            subtotal = data.get('subtotal_usd', 0)
            self.log_result("Get Cart with Items", True, f"Items: {item_count}, Subtotal: ${subtotal}")
        else:
            self.log_result("Get Cart with Items", False, f"Error: {data}")
        
        # Test update cart item
        update_item = {"product_id": self.test_product_id, "quantity": 1}
        success, data = self.make_request("PUT", "/cart/update", update_item, token=self.user_token)
        self.log_result("Update Cart Item", success,
                       f"Message: {data.get('message', 'Unknown')}" if success else f"Error: {data}")

    def test_order_operations(self):
        """Test order operations"""
        print("\n🔍 Testing Order Operations...")
        
        if not self.user_token or not self.test_product_id:
            self.log_result("Order Tests", False, "Missing user token or test product ID")
            return
        
        # Test create order
        order_data = {
            "items": [{"product_id": self.test_product_id, "quantity": 1}],
            "shipping_address": "123 Test Street",
            "shipping_city": "Nairobi",
            "shipping_country": "Kenya",
            "phone": "+254712345678",
            "currency": "KES",
            "payment_method": "stripe",
            "notes": "Test order"
        }
        
        success, data = self.make_request("POST", "/orders", order_data, token=self.user_token)
        if success:
            self.test_order_id = data.get('order_id')
            total = data.get('total_usd', 0)
            self.log_result("Create Order", True, f"Order ID: {self.test_order_id}, Total: ${total}")
        else:
            self.log_result("Create Order", False, f"Error: {data}")
        
        # Test get user orders
        success, data = self.make_request("GET", "/orders", token=self.user_token)
        if success:
            order_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get User Orders", True, f"Found {order_count} orders")
        else:
            self.log_result("Get User Orders", False, f"Error: {data}")
        
        # Test get specific order
        if self.test_order_id:
            success, data = self.make_request("GET", f"/orders/{self.test_order_id}", token=self.user_token)
            self.log_result("Get Order Details", success,
                           f"Status: {data.get('status', 'Unknown')}" if success else f"Error: {data}")

    def test_payment_integration(self):
        """Test payment integration"""
        print("\n🔍 Testing Payment Integration...")
        
        if not self.user_token or not self.test_order_id:
            self.log_result("Payment Tests", False, "Missing user token or test order ID")
            return
        
        # Test Stripe checkout creation
        checkout_data = {
            "order_id": self.test_order_id,
            "origin_url": "https://techgalaxy.preview.emergentagent.com"
        }
        
        success, data = self.make_request("POST", "/payments/stripe/checkout", checkout_data, token=self.user_token)
        if success and 'url' in data:
            self.log_result("Create Stripe Checkout", True, f"Checkout URL created")
        else:
            self.log_result("Create Stripe Checkout", False, f"Error: {data}")
        
        # Test M-Pesa initiation (should return mock response)
        success, data = self.make_request("POST", "/payments/mpesa/initiate?order_id=test&phone_number=254712345678", 
                                        token=self.user_token)
        if success and data.get('status') == 'mock':
            self.log_result("M-Pesa Integration (Mock)", True, "Mock response received")
        else:
            self.log_result("M-Pesa Integration (Mock)", False, f"Error: {data}")

    def test_admin_dashboard(self):
        """Test admin dashboard endpoints"""
        print("\n🔍 Testing Admin Dashboard...")
        
        if not self.admin_token:
            self.log_result("Admin Tests", False, "Missing admin token")
            return
        
        # Test dashboard stats
        success, data = self.make_request("GET", "/admin/stats", token=self.admin_token)
        if success:
            revenue = data.get('total_revenue_usd', 0)
            orders = data.get('total_orders', 0)
            customers = data.get('total_customers', 0)
            self.log_result("Admin Dashboard Stats", True, 
                           f"Revenue: ${revenue}, Orders: {orders}, Customers: {customers}")
        else:
            self.log_result("Admin Dashboard Stats", False, f"Error: {data}")
        
        # Test inventory management
        success, data = self.make_request("GET", "/admin/inventory", token=self.admin_token)
        if success:
            product_count = len(data.get('products', []))
            self.log_result("Admin Inventory", True, f"Found {product_count} products in inventory")
        else:
            self.log_result("Admin Inventory", False, f"Error: {data}")
        
        # Test customer management
        success, data = self.make_request("GET", "/admin/customers", token=self.admin_token)
        if success:
            customer_count = len(data.get('customers', []))
            self.log_result("Admin Customer Management", True, f"Found {customer_count} customers")
        else:
            self.log_result("Admin Customer Management", False, f"Error: {data}")

    def test_reviews(self):
        """Test review system"""
        print("\n🔍 Testing Review System...")
        
        if not self.user_token or not self.test_product_id:
            self.log_result("Review Tests", False, "Missing user token or test product ID")
            return
        
        # Test get product reviews
        success, data = self.make_request("GET", f"/reviews/{self.test_product_id}")
        if success:
            review_count = len(data) if isinstance(data, list) else 0
            self.log_result("Get Product Reviews", True, f"Found {review_count} reviews")
        else:
            self.log_result("Get Product Reviews", False, f"Error: {data}")
        
        # Test create review
        review_data = {
            "product_id": self.test_product_id,
            "rating": 5,
            "comment": "Great product! Test review from automated testing."
        }
        
        success, data = self.make_request("POST", "/reviews", review_data, token=self.user_token)
        if success:
            self.log_result("Create Product Review", True, f"Review created with rating {data.get('rating', 0)}")
        else:
            # Review might already exist, check if it's a duplicate error
            if "already reviewed" in str(data).lower():
                self.log_result("Create Product Review", True, "User already reviewed (expected)")
            else:
                self.log_result("Create Product Review", False, f"Error: {data}")

    def test_ai_recommendations(self):
        """Test AI recommendation system"""
        print("\n🔍 Testing AI Recommendations...")
        
        if not self.user_token or not self.test_product_id:
            self.log_result("AI Tests", False, "Missing user token or test product ID")
            return
        
        # Test product recommendations
        success, data = self.make_request("GET", f"/recommendations/{self.test_product_id}")
        if success:
            rec_count = len(data) if isinstance(data, list) else 0
            self.log_result("Product Recommendations", True, f"Found {rec_count} recommendations")
        else:
            self.log_result("Product Recommendations", False, f"Error: {data}")
        
        # Test AI-powered recommendations
        success, data = self.make_request("GET", "/ai/recommendations", token=self.user_token)
        if success:
            ai_recs = data.get('recommendations', [])
            self.log_result("AI Recommendations", True, f"Found {len(ai_recs)} AI recommendations")
        else:
            self.log_result("AI Recommendations", False, f"Error: {data}")

    def test_multi_currency(self):
        """Test multi-currency support"""
        print("\n🔍 Testing Multi-Currency Support...")
        
        # Test cart with different currencies
        currencies = ["KES", "USD", "EUR"]
        for currency in currencies:
            if self.user_token:
                success, data = self.make_request("GET", f"/cart?currency={currency}", token=self.user_token)
                if success:
                    subtotal = data.get('subtotal_local', 0)
                    self.log_result(f"Cart in {currency}", True, f"Subtotal: {subtotal} {currency}")
                else:
                    self.log_result(f"Cart in {currency}", False, f"Error: {data}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting TechGalaxy E-commerce Platform API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites in order
        self.test_health_check()
        self.test_authentication()
        self.test_products()
        self.test_cart_operations()
        self.test_order_operations()
        self.test_payment_integration()
        self.test_admin_dashboard()
        self.test_reviews()
        self.test_ai_recommendations()
        self.test_multi_currency()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
    tester = TechGalaxyAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())