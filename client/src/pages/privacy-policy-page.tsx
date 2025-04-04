import { MainLayout } from "@/components/layouts/main-layout";

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-card shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">What information do we collect?</h3>
              <p>We collect information from you when you register on our site or place an order.</p>
              <p className="mt-2">When ordering or registering on our site, as appropriate, you may be asked to enter your: name, e-mail address, phone number or payment information. You may, however, visit our site anonymously.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What do we use your information for?</h3>
              <p>Any of the information we collect from you may be used in one of the following ways:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>publishing any Website material in any other media;</li>
                <li>selling, sublicensing and/or otherwise commercialising any Website material;</li>
                <li>publicly performing and/or showing any Website material;</li>
              </ul>
              <p className="mt-2">Your information, whether public or private, will not be sold, exchanged, transferred, or given to any other company for any reason whatsoever, without your consent, other than for the express purpose of delivering the purchased product or service requested.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">How do we protect your information?</h3>
              <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
              <p className="mt-2">We offer the use of a secure server. All supplied sensitive/credit information is transmitted via Secure Socket Layer (SSL) technology and then encrypted into our Payment gateway providers database only to be accessible by those authorized with special access rights to such systems, and are required to keep the information confidential.</p>
              <p className="mt-2">After a transaction, your private information (credit cards, financials, etc.) will not be stored on our servers.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Do we use cookies?</h3>
              <p>Yes (Cookies are small files that a site or its service provider transfers to your computers hard drive through your Web browser (if you allow) that enables the sites or service providers systems to recognise your browser and capture and remember certain information</p>
              <p className="mt-2">We use cookies to help us remember and process the items in your shopping cart and understand and save your preferences for future visits.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Do we disclose any information to outside parties?</h3>
              <p>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential. We may also release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others rights, property, or safety.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Third party links</h3>
              <p>Occasionally, at our discretion, we may include or offer third party products or services on our website. These third party sites have separate and independent privacy policies. We therefore have no responsibility or liability for the content and activities of these linked sites. Nonetheless, we seek to protect the integrity of our site and welcome any feedback about these sites.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Terms and Conditions</h3>
              <p>Please also visit our Terms and Conditions section establishing the use, disclaimers, and limitations of liability governing the use of our website at</p>
              <p className="mt-1"><a href="/terms" className="text-primary hover:underline">https://www.iratech.com/terms</a></p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Consent</h3>
              <p>By using our site, you consent to our online privacy policy.</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}