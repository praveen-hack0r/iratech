import { MainLayout } from "@/components/layouts/main-layout";

export default function TermsPage() {
  return (
    <MainLayout>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-card shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Terms Of Service</h1>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Introduction</h3>
              <p>These Website Standard Terms and Conditions written on this webpage shall manage your use of this website. These Terms will be applied fully and affect to your use of this Website. By using this Website, you agreed to accept all terms and conditions written in here. You must not use this Website if you disagree with any of these Website Standard Terms and Conditions.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Intellectual Property Rights</h3>
              <p>Other than the content you own, under these Terms, IraTech and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted limited license only for purposes of viewing the material contained on this Website.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Restrictions</h3>
              <p>You are specifically restricted from all of the following:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>publishing any Website material in any other media;</li>
                <li>selling, sublicensing and/or otherwise commercialising any Website material;</li>
                <li>publicly performing and/or showing any Website material;</li>
                <li>using this Website in any way that is or may be damaging to this Website;</li>
                <li>using this Website in any way that impacts user access to this Website;</li>
                <li>using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity;</li>
                <li>engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website;</li>
                <li>using this Website to engage in any advertising or marketing.</li>
                <li>Certain areas of this Website are restricted from being access by you and IraTech may further restrict access by you to any areas of this Website, at any time, in absolute discretion. Any user ID and password you may have for this Website are confidential and you must maintain confidentiality as well.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Content</h3>
              <p>In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant IraTech a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.</p>
              <p className="mt-2">Your Content must be your own and must not be invading any third-party's rights. IraTech reserves the right to remove any of Your Content from this Website at any time without notice.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">No warranties</h3>
              <p>This Website is provided "as is," with all faults, and IraTech express no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Limitation of liability</h3>
              <p>In no event shall IraTech, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. IraTech, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Indemnification</h3>
              <p>You hereby indemnify to the fullest extent IraTech from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Variation of Terms</h3>
              <p>IraTech is permitted to revise these Terms at any time as it sees fit, and by using this Website you are expected to review these Terms on a regular basis.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Assignment</h3>
              <p>The IraTech is allowed to assign, transfer, and subcontract its rights and/or obligations under these Terms without any notification. However, you are not allowed to assign, transfer, or subcontract any of your rights and/or obligations under these Terms.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Entire Agreement</h3>
              <p>These Terms constitute the entire agreement between IraTech and you in relation to your use of this Website, and supersede all prior agreements and understandings.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Governing Law & Jurisdiction</h3>
              <p>These Terms will be governed by and interpreted in accordance with the laws of the State of Delhi, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Delhi for the resolution of any disputes.</p>
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