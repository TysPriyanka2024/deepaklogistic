const nodemailer = require('nodemailer');
const fs = require('fs');
const { SUCCESS } = require('../managers/notify/message.constants');
require('dotenv').config();



module.exports = {
    sendCustomMail : async (recipientEmail, subject, renderedEmailContent, invoiceLocations, invoiceName) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'joshfuels.india@gmail.com',
                pass: 'wwvvmxaagrubckyb',
            },
        });


        // Test connection
        transporter.verify((error, success) => {
            if (error) {
                console.error("SMTP Connection Failed:", error);
            } else {
                console.log("SMTP Connected Successfully!",success);
            }
        });
    
        try {
            let mailOptions = {
                from: 'demo@JoshFuels.com',
                to: recipientEmail,
                cc: "priya971110@gmail.com",
                subject: subject,
                html: renderedEmailContent,
                attachments: [{
                    filename: invoiceName,
                    path: invoiceLocations
                }]
            };
    
            let info = await transporter.sendMail(mailOptions);
            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Failed to send email' };
        }
    },
    verifyEmail: '../../../src/views/mail/email_verification.html',
    invoiceEmail: '../../../src/views/mail/invoice.ejs',
    ledgerEmail : '../../../src/views/mail/ledger.ejs'
    
}