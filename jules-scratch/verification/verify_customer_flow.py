from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Go to root and expect redirect to /menu
        page.goto("http://localhost:5173/")
        expect(page).to_have_url("http://localhost:5173/menu")

        # Wait for menu items to load from Firestore
        expect(page.get_by_role("heading", name="メニュー")).to_be_visible()

        # 2. Find the first "カートに追加" button and click it
        # This assumes at least one menu item is available
        add_to_cart_button = page.get_by_role("button", name="カートに追加").first
        # Wait up to 15 seconds for Firestore data to load
        expect(add_to_cart_button).to_be_visible(timeout=15000)
        add_to_cart_button.click()

        # 3. Verify cart summary and proceed to checkout
        checkout_button = page.get_by_role("button", name="注文へ進む")
        expect(checkout_button).to_be_visible()
        checkout_button.click()

        # 4. Verify checkout page
        expect(page).to_have_url("http://localhost:5173/checkout")
        expect(page.get_by_role("heading", name="ご注文内容の確認")).to_be_visible()

        # 5. Take screenshot
        page.screenshot(path="jules-scratch/verification/customer-flow.png")

        browser.close()

if __name__ == "__main__":
    run()
