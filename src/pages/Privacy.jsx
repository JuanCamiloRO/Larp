import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../css/legal.css";

/**
 * ⚠️ BEFORE SHIPPING: replace every [BRACKETED] placeholder below with your
 * real details, and have this reviewed by a lawyer familiar with your
 * jurisdiction. This is a starting template, not legal advice, and does not
 * guarantee compliance with GDPR, CCPA, HIPAA, or any other regulation.
 */

const APP_NAME = "Larp";
const COMPANY_NAME = "The Pampers Company";
const CONTACT_EMAIL = "camiloriascosospina@gmail.com";
const JURISDICTION = "Aarhus Kommune, Midtjylland. Denmark";
const LAST_UPDATED = "August 11, 2026";

const SECTIONS = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
];

function PrivacyLegal() {
  const navigate = useNavigate();
  const [active, setActive] = useState("privacy");

  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <button
          type="button"
          className="legal-page__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1>Privacy &amp; Legal</h1>
        <span aria-hidden="true" />
      </header>

      <nav className="legal-page__tabs" role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={active === s.id}
            className={active === s.id ? "legal-page__tab legal-page__tab--active" : "legal-page__tab"}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <main className="legal-page__content">
        <p className="legal-page__updated">Last updated: {LAST_UPDATED}</p>

        {active === "privacy" && (
          <section aria-labelledby="privacy-heading">
            <h2 id="privacy-heading">Privacy Policy</h2>

            <p>
              {COMPANY_NAME} ("we", "us", "our") operates {APP_NAME} (the "App"). This
              Privacy Policy explains what information we collect, how we use it, and
              the choices you have. By creating an account or using the App, you agree
              to the practices described here.
            </p>

            <h3>1. Information We Collect</h3>
            <p><strong>Account information.</strong> When you sign up, we collect your username, email address, and authentication credentials.</p>
            <p><strong>Fitness and health data.</strong> To provide the App's core features, we collect information you choose to enter, including your age, weight, height, training experience, fitness goals, weekly training frequency, workout logs, and weigh-in history.</p>
            <p><strong>Photos.</strong> If you use Body Scan or attach a progress photo to a weigh-in, we store the image you upload. These photos may depict your body and are treated as sensitive data — see Section 4.</p>
            <p><strong>Social and profile data.</strong> Your username, avatar, bio, and follower/following relationships may be visible to other users depending on your privacy settings.</p>
            <p><strong>Usage data.</strong> We automatically collect limited technical information (device type, app version, crash logs) to keep the App working reliably.</p>

            <h3>2. How We Use Your Information</h3>
            <ul>
              <li>To calculate personalized metrics (e.g. calorie targets, muscle activity heatmaps, body composition estimates)</li>
              <li>To operate account features such as login, profile display, and social following</li>
              <li>To store and display your workout and weight history over time</li>
              <li>To diagnose bugs and improve the App</li>
              <li>To communicate service-related updates to you</li>
            </ul>
            <p>We do not sell your personal data. We do not use your health or body-photo data for advertising.</p>

            <h3>3. Where Your Data Is Stored</h3>
            <p>
              Account records, workout data, and weight entries are stored using
              Supabase, our database and authentication provider. Progress photos and
              body scan images are stored using Cloudflare R2, a third-party object
              storage service, and are accessed only via short-lived signed URLs
              generated for your account.
            </p>

            <h3>4. Sensitive Data — Photos and Body Data</h3>
            <p>
              Progress photos and body-scan images are private by default and are not
              shared with other users unless you explicitly choose to share them. You
              may delete any photo at any time from your weight history. Deleting a
              photo removes it from active storage; deletion from backups may take up
              to 2-3 days to complete.
            </p>

            <h3>5. Sharing Your Information</h3>
            <p>We do not share your personal data with third parties except:</p>
            <ul>
              <li>With service providers who process data on our behalf (Supabase, Cloudflare) under contractual confidentiality obligations</li>
              <li>If required by law, subpoena, or legal process</li>
              <li>With your consent, or as necessary to provide a feature you've activated (e.g. public profile visibility)</li>
            </ul>

            <h3>6. Your Rights and Choices</h3>
            <p>Depending on where you live, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for optional features (e.g. public profile, photo uploads)</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h3>7. Data Retention</h3>
            <p>
              We retain your data for as long as your account is active. If you delete
              your account, we delete your profile, workout history, weigh-in
              records, and photos within [X] days, except where retention is required
              for legal or fraud-prevention purposes.
            </p>

            <h3>8. Children's Privacy</h3>
            <p>
              The App is not directed at children under 13 (or the minimum age
              required in your jurisdiction). We do not knowingly collect data from
              children. If you believe a child has created an account, contact us and
              we will remove it.
            </p>

            <h3>9. Security</h3>
            <p>
              We use industry-standard measures — including encrypted connections,
              access-controlled storage, and signed, time-limited URLs for photo
              access — to protect your data. No method of storage or transmission is
              100% secure, and we cannot guarantee absolute security.
            </p>

            <h3>10. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Material changes
              will be notified in-app or by email before they take effect.
            </p>

            <h3>11. Contact Us</h3>
            <p>
              Questions about this policy can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        )}

        {active === "terms" && (
          <section aria-labelledby="terms-heading">
            <h2 id="terms-heading">Terms of Service</h2>

            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using {APP_NAME}, you agree to be bound by these Terms.
              If you do not agree, do not use the App.
            </p>

            <h3>2. Eligibility</h3>
            <p>
              You must be at least 13 years old (or the minimum age of digital
              consent in your jurisdiction) to use the App. By using the App, you
              represent that you meet this requirement.
            </p>

            <h3>3. Your Account</h3>
            <p>
              You are responsible for maintaining the confidentiality of your login
              credentials and for all activity under your account. Notify us
              immediately of any unauthorized use.
            </p>

            <h3>4. Health and Fitness Disclaimer</h3>
            <p>
              {APP_NAME} provides fitness tracking, calorie estimates, and body
              composition tools for informational purposes only. This is not medical
              advice. The App's calorie, body-fat, and muscle-activity estimates are
              approximations and should not replace guidance from a qualified
              physician, dietitian, or fitness professional. Consult a healthcare
              provider before beginning any new diet or exercise program, especially
              if you have a pre-existing medical condition.
            </p>

            <h3>5. Acceptable Use</h3>
            <p>You agree not to:</p>
            <ul>
              <li>Upload content that is unlawful, abusive, or infringes another person's rights</li>
              <li>Upload images of anyone other than yourself without their consent</li>
              <li>Attempt to access another user's account or data without authorization</li>
              <li>Reverse-engineer, scrape, or interfere with the App's operation</li>
              <li>Use the App to harass, impersonate, or harm another person</li>
            </ul>

            <h3>6. User Content</h3>
            <p>
              You retain ownership of the photos, workout logs, and other content you
              upload. By uploading content, you grant {COMPANY_NAME} a limited license
              to store, process, and display that content back to you (and to other
              users, only where you've enabled sharing) solely to operate the App.
            </p>

            <h3>7. Termination</h3>
            <p>
              You may delete your account at any time. We may suspend or terminate
              accounts that violate these Terms or applicable law, with or without
              notice.
            </p>

            <h3>8. Disclaimers</h3>
            <p>
              The App is provided "as is" without warranties of any kind, express or
              implied. We do not guarantee the accuracy of calorie, macro, or body
              composition estimates.
            </p>

            <h3>9. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, {COMPANY_NAME} is not liable for
              any indirect, incidental, or consequential damages arising from your use
              of the App, including any health or fitness outcomes.
            </p>

            <h3>10. Governing Law</h3>
            <p>
              These Terms are governed by the laws of {JURISDICTION}, without regard
              to conflict-of-law principles.
            </p>

            <h3>11. Changes to These Terms</h3>
            <p>
              We may revise these Terms from time to time. Continued use of the App
              after changes take effect constitutes acceptance of the revised Terms.
            </p>

            <h3>12. Contact</h3>
            <p>
              Questions about these Terms can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default PrivacyLegal;