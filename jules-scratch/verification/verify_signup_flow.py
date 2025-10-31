from playwright.sync_api import sync_playwright, Page, expect
import os

def run_verification(page: Page):
    """
    Verifies the login page's link to the signup page and the signup page itself.
    """
    os.makedirs("jules-scratch/verification", exist_ok=True)

    print("Navigating to login page...")
    page.goto("http://localhost:5173/login")

    # --- DEBUGGING STEPS ---
    print("Waiting for 5 seconds to ensure page loads...")
    page.wait_for_timeout(5000) # Wait for dev server to be ready

    title = page.title()
    print(f"Current page title: '{title}'")

    print("Taking a debug screenshot...")
    page.screenshot(path="jules-scratch/verification/debug_login_page.png")
    # --- END DEBUGGING STEPS ---

    signup_link = page.get_by_role("link", name="新規登録")
    expect(signup_link).to_be_visible()

    print("Taking screenshot of login page...")
    page.screenshot(path="jules-scratch/verification/login_page_with_signup_link.png")

    print("Clicking signup link...")
    signup_link.click()

    print("Verifying signup page content...")
    expect(page).to_have_url("http://localhost:5173/signup")
    expect(page.get_by_role("heading", name="新規アカウント登録")).to_be_visible()

    print("Taking screenshot of signup page...")
    page.screenshot(path="jules-scratch/verification/signup_page.png")

    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
