from playwright.sync_api import sync_playwright, Page, expect
import os

def run_verification(page: Page):
    """
    Verifies the new options management page UI.
    """
    os.makedirs("jules-scratch/verification", exist_ok=True)

    # 1. Login to the admin page
    print("Logging in...")
    page.goto("http://localhost:5173/login")
    page.get_by_test_id('email-input').fill('test@test.test')
    page.get_by_test_id('password-input').fill('112233')
    page.get_by_test_id('login-button').click()
    expect(page).to_have_url("http://localhost:5173/admin/dashboard", timeout=10000)

    # 2. Navigate to the options management page
    print("Navigating to options page...")
    page.get_by_role('link', name='オプション管理').click()
    expect(page).to_have_url("http://localhost:5173/admin/options")

    # 3. Verify the content of the page
    print("Verifying page content...")
    expect(page.get_by_role('heading', name='オプション管理')).to_be_visible()

    # Check for the dummy data items
    expect(page.get_by_text('サイズ')).to_be_visible()
    expect(page.get_by_text('タイプ: 1つ選択 | 選択肢: S, M, L')).to_be_visible()

    expect(page.get_by_text('トッピング')).to_be_visible()
    expect(page.get_by_text('タイプ: 複数選択 | 選択肢: チーズ, ベーコン')).to_be_visible()

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/options_page.png")

    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
