from playwright.sync_api import sync_playwright, Page, expect
import os

def run_verification(page: Page):
    """
    Verifies the new stock management UI in the menu form dialog.
    """
    os.makedirs("jules-scratch/verification", exist_ok=True)

    # 1. Login to the admin page
    print("Logging in...")
    page.goto("http://localhost:5173/login")
    page.get_by_test_id('email-input').fill('test@test.test')
    page.get_by_test_id('password-input').fill('112233')
    page.get_by_test_id('login-button').click()
    expect(page).to_have_url("http://localhost:5173/admin/dashboard")

    # 2. Navigate to the menu management page
    print("Navigating to menu page...")
    page.get_by_role('link', name='メニュー管理').click()
    expect(page).to_have_url("http://localhost:5173/admin/menu")
    expect(page.get_by_role('heading', name='メニュー管理')).to_be_visible()

    # 3. Open the "Add Menu" dialog
    print("Opening menu form dialog...")
    page.get_by_role('button', name='新規追加').click()
    expect(page.get_by_role('heading', name='メニューを追加')).to_be_visible()

    # 4. Verify initial state (stock field should NOT be visible)
    print("Verifying initial UI state...")
    stock_input = page.get_by_label('在庫数')
    expect(stock_input).not_to_be_visible()

    # Take a screenshot of the initial state
    page.screenshot(path="jules-scratch/verification/stock_ui_initial.png")

    # 5. Toggle the switch and verify the stock field appears
    print("Toggling stock management switch...")
    stock_switch = page.get_by_label('在庫を管理する')
    stock_switch.click()
    expect(stock_input).to_be_visible()

    # Take a screenshot of the state after toggling
    print("Taking screenshot of the final state...")
    page.screenshot(path="jules-scratch/verification/stock_ui_toggled.png")

    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
