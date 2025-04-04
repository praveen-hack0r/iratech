import React from 'react';
import { MainLayout } from '@/components/layouts/main-layout';

export default function ServicesPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 py-16 mb-12 border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Services</h1>
          <p className="text-primary text-xl max-w-2xl mx-auto font-medium">Professional information security services</p>
        </div>
      </div>
      
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-lg p-6 shadow-sm border border-blue-100 dark:border-blue-900 mb-12">
            <div className="center mb-6">
              <h1 className="text-center text-2xl font-bold text-primary">IraTech provides services in the field of information security.</h1>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">List of services provided by us:</h2>
            
            <div className="space-y-8">
              {/* Penetration Testing Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary">Penetration testing</h3>
                <p className="font-medium">Our team will attempt to hack your system using the same techniques used by black-hat hackers and give you a detailed report of all the weaknesses they find.</p>
                <h5 className="font-medium">What Is Pen Testing and Why Is It Important to Perform?</h5>
                <p>Penetration testing is performed under controlled conditions, often by a reputable third party with substantial security experience. The goal of pen testing is to see what happens when testers act like attackers and use common compromise tools and tactics against your system.</p>
                <p>Companies can conduct pen testing themselves, but it's often worth partnering with firms that have dedicated expertise in this area.</p>
                <p>This is beneficial for two reasons:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Experienced pen testing teams have the tools and technologies necessary to thoroughly assess your system rather than your team having to design the process from scratch.</li>
                  <li>Third-party experts will attack your network in ways internal teams won't expect. Familiarity with existing frameworks often predisposes internal teams to assume security in specific areas rather than conducting in-depth analysis. External pen testers have no such bias.</li>
                </ol>
                <p>Our team will do Pentesting manually. It will provide more and more vulnerabilities which makes your system more and more secure.</p>
              </div>
              
              {/* Training Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary">Training</h3>
                <h4 className="font-medium">We provide training on following topics:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bug-bounty</li>
                  <li>Social Engineering attacks with defensive techniques</li>
                  <li>Network hacking with defensive techniques</li>
                  <li>Dark web, anonymity, privacy & security</li>
                  <li>Digital forensic</li>
                  <li>Website Creation</li>
                  <li>Android App development</li>
                  <li>Python programming from scratch.</li>
                </ul>
                <p>Our training is completely practical based with understanding deeply concepts of theory part.</p>
                <p>We also provide certificate on completion of training and you can apply for jobs in MNC's </p>
              </div>
              
              {/* Consulting Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-primary">Consulting</h3>
                <p>Our team is made up of experienced ethical hackers who worked with MNC's and governments as consultants and as ethical hackers.</p>
                <h4 className="font-medium">Available Consultants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-900">
                    <h5 className="font-medium text-center my-3">Praveen Khatri (Ethical Hacker)</h5>
                  </div>
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-900">
                    <h5 className="font-medium text-center my-3">Ravi Khatri (Ethical Hacker)</h5>
                  </div>
                </div>
                <h4 className="font-medium mt-4">Private & Confidential</h4>
                <p>We take your privacy seriously so you can discuss all your cyber security needs and get expert advice in confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}