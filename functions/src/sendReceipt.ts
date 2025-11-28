import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

const db = admin.firestore();

export const sendReceipt = functions.region('asia-northeast1').https.onCall(async (data, context) => {
    console.log("sendReceipt: Function started");

    // 1. Check Configuration
    const gmailEmail = functions.config().gmail?.email || process.env.GMAIL_EMAIL;
    const gmailPassword = functions.config().gmail?.password || process.env.GMAIL_PASSWORD;

    if (!gmailEmail || !gmailPassword) {
        console.error("sendReceipt: Missing credentials");
        throw new functions.https.HttpsError("internal", "Email configuration missing");
    }

    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: gmailEmail,
            pass: gmailPassword,
        },
    });

    try {
        // 3. Verify Connection
        await transporter.verify();
        console.log("sendReceipt: SMTP connection verified");
    } catch (verifyError) {
        console.error("sendReceipt: SMTP Connection Failed", verifyError);
        throw new functions.https.HttpsError("internal", "Failed to connect to email server", verifyError);
    }

    const { orderId, email } = data;
    console.log("sendReceipt: Request data", { orderId, targetEmail: email });

    if (!orderId || !email) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with 'orderId' and 'email'."
        );
    }

    try {
        // 4. Fetch Order
        console.log(`sendReceipt: Fetching order ${orderId}`);
        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            console.error("sendReceipt: Order not found");
            throw new functions.https.HttpsError("not-found", "Order not found.");
        }

        const orderData = orderDoc.data();
        const items = orderData?.items || [];
        const totalPrice = orderData?.totalPrice || 0;
        const orderNumber = orderData?.orderNumber || "N/A";
        const storeId = orderData?.storeId;

        // Format Date (YYYY/MM/DD)
        const createdAt = orderData?.createdAt?.toDate ? orderData.createdAt.toDate() : new Date();
        const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')}`;

        // 5. Fetch Store Info (for Invoice)
        let storeName = "Marche App";
        let invoiceNumber = "";

        if (storeId) {
            try {
                const storeDoc = await db.collection("stores").doc(storeId).get();
                if (storeDoc.exists) {
                    const storeData = storeDoc.data();
                    if (storeData?.storeName) storeName = storeData.storeName;
                    if (storeData?.invoiceNumber) invoiceNumber = storeData.invoiceNumber;
                }
            } catch (err) {
                console.error("sendReceipt: Error fetching store info", err);
                // Continue with default values
            }
        }

        // Calculate Tax (Assuming 10% included)
        // Tax = Total - (Total / 1.1)
        const taxAmount = Math.floor(totalPrice - (totalPrice / 1.1));

        console.log("sendReceipt: Order data fetched", { orderNumber, itemCount: items.length, storeName });

        // 6. Construct Email
        const itemsHtml = items
            .map(
                (item: any) => {
                    let optionsHtml = "";
                    if (item.selectedOptions && item.selectedOptions.length > 0) {
                        optionsHtml = `
              <ul style="font-size: 0.9em; color: #666; margin: 4px 0 0 20px; padding: 0;">
                ${item.selectedOptions.map((opt: any) =>
                            `<li>${opt.groupName}: ${opt.choiceName} (${opt.priceModifier >= 0 ? '+' : ''}¥${opt.priceModifier})</li>`
                        ).join("")}
              </ul>
            `;
                    }

                    return `
            <li style="margin-bottom: 8px;">
              ${item.name} x ${item.quantity} - ¥${item.price.toLocaleString()}
              ${optionsHtml}
            </li>
          `;
                }
            )
            .join("");

        const mailOptions = {
            from: `"${storeName}" <${gmailEmail}>`,
            to: email,
            subject: `【${storeName}】レシート (注文番号: #${orderNumber})`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #333;">ご注文ありがとうございます</h2>
          <p>以下の内容でご注文を承りました。</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.1em;">店舗名: ${storeName}</h3>
            ${invoiceNumber ? `<p style="margin: 0; font-size: 0.9em;">登録番号: ${invoiceNumber}</p>` : ''}
            <p style="margin: 0; font-size: 0.9em;">発行日: ${formattedDate}</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <h3 style="margin: 0 0 10px 0;">注文番号: #${orderNumber}</h3>
          <ul style="padding-left: 20px;">
            ${itemsHtml}
          </ul>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <h3 style="text-align: right; margin: 0 0 5px 0;">合計金額: ¥${totalPrice.toLocaleString()} (税込)</h3>
          <p style="text-align: right; margin: 0; font-size: 0.85em; color: #666;">(内消費税等(10%): ¥${taxAmount.toLocaleString()})</p>
          
          <p style="margin-top: 30px;">またのご利用をお待ちしております。</p>
        </div>
      `,
        };

        // 7. Send Email
        console.log("sendReceipt: Sending email...");
        const info = await transporter.sendMail(mailOptions);
        console.log("sendReceipt: Email sent successfully", info);

        return { success: true, message: "Receipt sent successfully." };
    } catch (error) {
        console.error("sendReceipt: Error during execution", error);
        console.log("sendReceipt: Full error details", JSON.stringify(error, Object.getOwnPropertyNames(error)));

        throw new functions.https.HttpsError(
            "internal",
            "Failed to send receipt.",
            error
        );
    }
});
