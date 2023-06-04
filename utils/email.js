const nodemailer = require('nodemailer');
const mustache = require('mustache');
const fs = require('fs');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Phat ${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    fs.readFile(
      `${__dirname}/../template/${template}.html`,
      'utf-8',
      async (error, emailTemplate) => {
        if (error) {
          console.error('Error reading email template:', error);
          return;
        }

        const html = mustache.render(emailTemplate, {
          firstName: this.firstName,
          url: this.url,
          subject: subject,
        });

        //2) Defaine the email options
        const mailOptions = {
          from: this.from,
          to: this.to,
          subject,
          html,
          text: htmlToText.convert(html),
        };

        //3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
      }
    );
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Next Tour');
  }

  async sendPasswordReset() {
    await this.send(
      'password',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
