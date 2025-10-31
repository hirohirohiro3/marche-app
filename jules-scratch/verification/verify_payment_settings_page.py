from playwright.sync_api import sync_playwright, Page, expect
import os

def run_verification(page: Page):
    """
    Verifies the new payment settings page UI.
    """
    os.makedirs("jules-scratch/verification", exist_ok=True)

    # 1. Login to the admin page
    print("Logging in...")
    page.goto("http://localhost:5173/login")
    page.get_by_test_id('email-input').fill('test@test.test')
    page.get_by_test_id('password-input').fill('112233')
    page.get_by_test_id('login-button').click()
    expect(page).to_have_url("http://localhost:5173/admin/dashboard", timeout=10000)

    # 2. Navigate to the payment settings page
    print("Navigating to payment settings page...")
    page.get_by_role('link', name='決済設定').click()
    expect(page).to_have_url("http://localhost:5173/admin/settings/payment")

    # 3. Verify the content of the page
    print("Verifying page content...")
    expect(page.get_by_role('heading', name='決済設定')).to_be_visible()

    # Check for the payment method options
    expect(page.get_by_label('レジでの支払いのみ')).to_be_visible()
    expect(page.get_by_label('アプリ内決済 と レジでの支払いの両方')).to_be_visible()
    expect(page.get_by_label('アプリ内決済のみ')).to_be_visible()

    # Check for the Stripe connect button
    expect(page.get_by_role('button', name='Stripeアカウントを連携')).to_be_visible()

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/payment_settings_page.png")

    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
