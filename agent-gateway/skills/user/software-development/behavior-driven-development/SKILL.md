---
name: Behavior-Driven Development
description: Collaborative software development approach bridging technical and business teams using natural language specifications
category: software-development
---
# Behavior-Driven Development

## What I do

I bridge the gap between technical and non-technical stakeholders by using natural language specifications written in Given-When-Then format. BDD extends TDD by focusing on the behavior of software from the user's perspective. It promotes collaboration between developers, QA, product owners, and other stakeholders through shared understanding. Features are documented in a ubiquitous language that everyone can understand.

## When to use me

Use BDD when working with product owners or business stakeholders who need to understand and validate software behavior. It's ideal for complex business workflows where clear requirements are essential. BDD shines in domains with complex business rules, regulated industries requiring documentation, or teams practicing specification-by-example. Don't use it for low-level utility code or when rapid prototyping without formal requirements.

## Core Concepts

- **Gherkin Language**: Plain-text syntax for behavior specifications
- **Feature Files**: Human-readable descriptions of features
- **Given-When-Then Structure**: Arrange, Act, Assert pattern in natural language
- **Scenario Outline**: Parametrized scenarios with examples
- **Background**: Common setup steps across scenarios
- **Tags**: Organizing and filtering features
- **Ubiquitous Language**: Shared vocabulary between domain experts and developers
- **Living Documentation**: Executable specifications that serve as documentation
- **Example Mapping**: Technique for discovering examples with stakeholders
- **Discovery Workshops**: Collaborative sessions to explore behavior

## Code Examples

### Gherkin Feature File

```gherkin
Feature: Shopping Cart Checkout
  As a customer
  I want to complete my purchase
  So that I can receive my ordered items

  Background:
    Given the store has the following products:
      | product_id | name     | price |
      | BOOK001    | Python   | 29.99 |
      | ELEC001    | Keyboard | 59.99 |
    And the tax rate is 8%

  Scenario: Guest customer completes purchase
    Given I have added "Python" to my cart
    And I have added "Keyboard" to my cart
    When I proceed to checkout as a guest
    And I enter shipping address:
      | field    | value              |
      | street   | 123 Main St        |
      | city     | Boston             |
      | state    | MA                 |
      | zip      | 02101              |
    And I enter payment details:
      | method   | card_number        |
      | Visa     | 4111111111111111   |
    Then I should see order summary:
      | subtotal | $89.98 |
      | tax     | $7.20  |
      | total   | $97.18 |
    And I should receive order confirmation

  Scenario: VIP customer receives discount
    Given customer "vip_user" has VIP status
    And I have added "Python" to my cart
    When I proceed to checkout
    And I authenticate as "vip_user"
    Then I should see discount applied:
      | original | $29.99 |
      | discount| $3.00  |
      | final   | $26.99 |

  Scenario Outline: Checkout with invalid payment
    Given I have added "<product>" to my cart
    When I proceed to checkout
    And I enter payment with card number "<card_number>"
    Then I should see error "<error_message>"

    Examples:
      | product | card_number          | error_message               |
      | Python  | invalid              | Invalid card number         |
      | Python | 1234                 | Card number too short       |
      | Python | expired              | Card has expired            |
```

### Python Behave Implementation

```python
from behave import given, when, then
from decimal import Decimal
from dataclasses import dataclass

@dataclass
class Product:
    product_id: str
    name: str
    price: Decimal

@dataclass
class CartItem:
    product: Product
    quantity: int

class ShoppingCart:
    def __init__(self):
        self.items: list[CartItem] = []
    
    def add_item(self, product: Product, quantity: int = 1) -> None:
        self.items.append(CartItem(product, quantity))
    
    @property
    def subtotal(self) -> Decimal:
        return sum(item.product.price * item.quantity for item in self.items)

@given("the store has the following products")
def step_store_products(context):
    context.products = {}
    for row in context.table:
        product = Product(
            product_id=row["product_id"],
            name=row["name"],
            price=Decimal(row["price"])
        )
        context.products[row["product_id"]] = product

@given("the tax rate is {rate}%")
def step_tax_rate(context, rate):
    context.tax_rate = Decimal(rate) / 100

@given("I have added {product_name} to my cart")
def step_add_to_cart(context, product_name):
    if not hasattr(context, 'cart'):
        context.cart = ShoppingCart()
    
    for product in context.products.values():
        if product.name == product_name:
            context.cart.add_item(product)
            break

@when("I proceed to checkout")
def step_checkout(context):
    context.checkout_total = context.cart.subtotal * (1 + context.tax_rate)

@then("I should see order summary")
def step_order_summary(context):
    for row in context.table:
        field = row["field"]
        expected_value = Decimal(row["value"].replace("$", ""))
        if field == "subtotal":
            assert context.cart.subtotal == expected_value
        elif field == "total":
            assert context.checkout_total == expected_value
```

### BDD with pytest-bdd

```python
import pytest
from pytest_bdd import scenario, given, when, then, parsers
from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

@dataclass
class BankAccount:
    account_id: str
    balance: Decimal = Decimal("0")
    overdraft_limit: Decimal = Decimal("0")

class BankService:
    def __init__(self):
        self.accounts: dict[str, BankAccount] = {}
    
    def create_account(self, account_id: str, overdraft_limit: str = "0") -> BankAccount:
        account = BankAccount(
            account_id=account_id,
            overdraft_limit=Decimal(overdraft_limit)
        )
        self.accounts[account_id] = account
        return account
    
    def deposit(self, account_id: str, amount: str) -> None:
        account = self.accounts[account_id]
        account.balance += Decimal(amount)
    
    def withdraw(self, account_id: str, amount: str) -> bool:
        account = self.accounts[account_id]
        new_balance = account.balance - Decimal(amount)
        if new_balance >= -account.overdraft_limit:
            account.balance = new_balance
            return True
        return False
    
    def get_balance(self, account_id: str) -> Decimal:
        return self.accounts[account_id].balance

@pytest.fixture
def bank_service():
    return BankService()

@scenario(
    "features/bank_account.feature",
    "Customer withdraws within overdraft limit"
)
def test_within_overdraft(bank_service):
    pass

@given("my account has balance of $500")
def account_balance(bank_service):
    bank_service.create_account("acc123")
    bank_service.deposit("acc123", "500")

@when("I withdraw $200")
def withdraw_amount(bank_service, context):
    context.result = bank_service.withdraw("acc123", "200")

@then("the withdrawal should be successful")
def verify_withdrawal(bank_service):
    assert bank_service.get_balance("acc123") == Decimal("300")
```

### Living Documentation

```python
"""
This module generates living documentation from BDD scenarios.
Run: python -m behave features/ -f html -o behave-report.html
"""

from behave import register_type
from decimal import Decimal

register_type(
    money=lambda x: Decimal(x.replace("$", "").replace(",", ""))
)

# Additional step implementations for comprehensive documentation

@given("customer {customer_id} has VIP status")
def set_vip_status(context, customer_id):
    if not hasattr(context, 'customer_status'):
        context.customer_status = {}
    context.customer_status[customer_id] = "VIP"

@when("I authenticate as {customer_id}")
def authenticate_customer(context, customer_id):
    if customer_id in context.customer_status:
        context.is_vip = context.customer_status[customer_id] == "VIP"
    else:
        context.is_vip = False

@then("I should see discount applied")
def verify_discount(context):
    assert hasattr(context, 'is_vip')
    assert context.is_vip is True
```

### Example Mapping Session Output

```python
"""
Example Mapping - Collaborative session to discover examples

Story: Shopping Cart Checkout
Rule: Tax must be calculated correctly

Example 1: In-state purchase
  - Items: $100 subtotal
  - Tax rate: 8%
  - Expected: $108 total

Example 2: Out-of-state purchase (tax exempt)
  - Items: $100 subtotal
  - Shipping: Massachusetts
  - Tax rate: 0%
  - Expected: $100 total

Example 3: Mixed taxable and exempt items
  - Taxable: $80
  - Exempt: $20
  - Tax rate: 8%
  - Expected: $86.40 total
"""

from decimal import Decimal

class TaxCalculator:
    def __init__(self, tax_rules: dict):
        self.tax_rules = tax_rules
    
    def calculate_tax(
        self,
        items: list[dict],
        shipping_state: str
    ) -> Decimal:
        taxable_amount = sum(
            Decimal(str(item["price"]))
            for item in items
            if self._is_taxable(item, shipping_state)
        )
        rate = self._get_tax_rate(shipping_state)
        return taxable_amount * rate
    
    def _is_taxable(self, item: dict, state: str) -> bool:
        exempt_states = ["MA"]  # Simplified for example
        return item.get("taxable", True) and state not in exempt_states
    
    def _get_tax_rate(self, state: str) -> Decimal:
        rates = {"CA": Decimal("0.0825"), "NY": Decimal("0.08")}
        return rates.get(state, Decimal("0"))
```

## Best Practices

1. **Use Ubiquitous Language**: Terms should mean the same to all team members
2. **Start with Examples**: Collaboratively discover examples with stakeholders
3. **Keep Scenarios Short**: Each scenario should test one behavior
4. **Avoid Implementation Details**: Focus on outcomes, not how
5. **Use Tags for Organization**: Tag features by component, priority, or owner
6. **Run Tests Automatically**: Integrate BDD tests in CI/CD pipeline
7. **Generate Documentation**: Use BDD outputs as living documentation
8. **Involve Domain Experts**: Non-developers should understand and write scenarios
9. **Example Mapping Sessions**: Use structured workshops to explore behavior
10. **Refactor Scenarios**: Keep scenarios current as requirements evolve
11. **Avoid Happy Path Only**: Cover edge cases and error scenarios
12. **Maintain Single Source**: One feature file, not duplicated tests
