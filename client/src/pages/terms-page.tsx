import { MainLayout } from "@/components/layouts/main-layout";

export default function TermsPage() {
  return (
    <MainLayout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-card shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Introduction</h3>
              <p>Welcome to IraTech. By accessing our website, you agree to these Terms and Conditions, Privacy Policy, and any other terms referenced herein.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">2. Intellectual Property Rights</h3>
              <p>All content on IraTech, including but not limited to text, graphics, logos, images, audio clips, video clips, and software, is the property of IraTech and is protected by copyright, trademark, and other intellectual property laws.</p>
              <p className="mt-2">Users may not:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Republish material from IraTech without proper attribution</li>
                <li>Sell, rent, or sub-license material from IraTech</li>
                <li>Reproduce, duplicate, or copy material from IraTech for commercial purposes</li>
                <li>Redistribute content from IraTech (unless content is specifically made for redistribution)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">3. User Accounts</h3>
              <p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
              <p className="mt-2">You agree to accept responsibility for all activities that occur under your account. If you believe there has been unauthorized use of your account, you must notify us immediately.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">4. Course Enrollment and Payment</h3>
              <p>By enrolling in a course, you agree to pay all fees associated with the course. All payments are processed securely via UPI. Course enrollment may be subject to additional terms specific to that course.</p>
              <p className="mt-2">We reserve the right to modify course pricing at any time. Refunds are subject to our refund policy outlined in section 5.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">5. Refund Policy</h3>
              <p>Refund requests must be made within 7 days of course enrollment. After 7 days, no refunds will be provided. Refunds are processed within 14 business days.</p>
              <p className="mt-2">We reserve the right to refuse a refund if we detect fraudulent activity or abuse of our refund policy.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">6. User Content</h3>
              <p>By posting content on our platform, you grant us a non-exclusive license to use, reproduce, adapt, publish, and distribute that content on our platform and promotional materials.</p>
              <p className="mt-2">You represent and warrant that content you post does not violate any third-party rights and complies with our content guidelines.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">7. Prohibited Activities</h3>
              <p>You may not access or use the Site for any purpose other than that for which we make the Site available. Prohibited activities include:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Systematic retrieval of data to create a collection or database</li>
                <li>Making unauthorized copies of course materials</li>
                <li>Attempting to bypass any security measures</li>
                <li>Impersonating another user or person</li>
                <li>Using the site in a manner that could disable, overburden, or impair the site</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">8. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, IraTech shall not be liable for any direct, indirect, punitive, incidental, special, or consequential damages, or any damages whatsoever, including damages for loss of use, data, or profits, arising out of or in any way connected with the use or performance of our platform.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">9. Changes to Terms</h3>
              <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the platform after changes constitutes acceptance of the modified terms.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">10. Contact Information</h3>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <p className="mt-1">support@iratech.com</p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}