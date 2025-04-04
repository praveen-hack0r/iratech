import React from 'react';
import { MainLayout } from '@/components/layouts/main-layout';

export default function ServicesPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 py-16 mb-12 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Our Services</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">Professional information security services</p>
        </div>
      </div>
      
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800/50 p-8 rounded-xl shadow-md backdrop-blur-sm mb-12 border border-gray-100 dark:border-gray-700">
            <div className="mb-8 text-center">
              <h1 className="text-center text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">IraTech provides services in the field of information security</h1>
              <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto"></div>
            </div>
            
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">List of services provided by us:</h2>
            
            <div className="space-y-10">
              {/* Penetration Testing Section */}
              <div className="space-y-4 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center mr-2.5">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  Penetration Testing
                </h3>
                <p className="font-medium text-gray-700 dark:text-gray-300">Our team will attempt to hack your system using the same techniques used by black-hat hackers and give you a detailed report of all the weaknesses they find.</p>
                <h5 className="font-medium text-gray-800 dark:text-gray-200">What Is Pen Testing and Why Is It Important to Perform?</h5>
                <p className="text-gray-600 dark:text-gray-400">Penetration testing is performed under controlled conditions, often by a reputable third party with substantial security experience. The goal of pen testing is to see what happens when testers act like attackers and use common compromise tools and tactics against your system.</p>
                <p className="text-gray-600 dark:text-gray-400">Companies can conduct pen testing themselves, but it's often worth partnering with firms that have dedicated expertise in this area.</p>
                <p className="text-gray-700 dark:text-gray-300 font-medium">This is beneficial for two reasons:</p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Experienced pen testing teams have the tools and technologies necessary to thoroughly assess your system rather than your team having to design the process from scratch.</li>
                  <li>Third-party experts will attack your network in ways internal teams won't expect. Familiarity with existing frameworks often predisposes internal teams to assume security in specific areas rather than conducting in-depth analysis. External pen testers have no such bias.</li>
                </ol>
                <p className="text-gray-700 dark:text-gray-300 font-medium">Our team will do Pentesting manually. It will provide more and more vulnerabilities which makes your system more and more secure.</p>
              </div>
              
              {/* Training Section */}
              <div className="space-y-4 bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-lg border border-purple-100 dark:border-purple-900/30">
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center mr-2.5">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  Training
                </h3>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">We provide training on following topics:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 list-disc text-gray-600 dark:text-gray-400">
                  <li>Bug-bounty</li>
                  <li>Social Engineering attacks with defensive techniques</li>
                  <li>Network hacking with defensive techniques</li>
                  <li>Dark web, anonymity, privacy & security</li>
                  <li>Digital forensic</li>
                  <li>Website Creation</li>
                  <li>Android App development</li>
                  <li>Python programming from scratch</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400">Our training is completely practical based with understanding deeply concepts of theory part.</p>
                <p className="text-gray-700 dark:text-gray-300 font-medium">We also provide certificate on completion of training and you can apply for jobs in MNC's.</p>
              </div>
              
              {/* Consulting Section */}
              <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                <h3 className="text-xl font-semibold text-primary flex items-center">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center mr-2.5">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  Consulting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Our team is made up of experienced ethical hackers who worked with MNC's and governments as consultants and as ethical hackers.</p>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Available Consultants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary">PK</span>
                    </div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Praveen Khatri</h5>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Ethical Hacker</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-primary">RK</span>
                    </div>
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Ravi Khatri</h5>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Ethical Hacker</p>
                  </div>
                </div>
                <h4 className="font-medium mt-2 text-gray-800 dark:text-gray-200">Private & Confidential</h4>
                <p className="text-gray-600 dark:text-gray-400">We take your privacy seriously so you can discuss all your cyber security needs and get expert advice in confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}