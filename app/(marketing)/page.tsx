import { Button } from "@/components/ui/Button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner */}
      <div className="bg-slate-900 text-white py-3 px-6">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            <span className="font-semibold">NEW:</span> Real-time pricing updates from Signature Solar.{" "}
            <a href="#pricing" className="underline hover:text-emerald-400 transition-colors">
              Learn more →
            </a>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xl font-bold text-slate-900">SignatureQuote</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="/products" className="text-sm text-slate-600 hover:text-slate-900">Products</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</a>
              <a href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Resources</a>
            </div>

            <div className="flex items-center gap-4">
              <a href="/auth/sign-in" className="text-sm text-slate-600 hover:text-slate-900">Log in</a>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6" asChild>
                <a href="/auth/sign-in">Get started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-8">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-slate-700 tracking-wide">#1 QUOTE BUILDER FOR SOLAR PROFESSIONALS</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-bold text-slate-900 mb-8 leading-[1.05] tracking-tight">
              Professional solar quotes{" "}
              <span className="text-emerald-600">in seconds</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access Signature Solar&apos;s complete catalog with live pricing. Build professional quotes in under 60 seconds. Save 90% of time on quote generation.
            </p>

            {/* CTA */}
            <div className="mb-8">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-10 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href="#pricing" className="flex items-center gap-2">
                  Start building quotes
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Rated 4.9/5 by installers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Workflow Tabs */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="px-4 py-2 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              SEARCH
            </div>
            <div className="px-4 py-2 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              BUILD
            </div>
            <div className="px-4 py-2 rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 border-2 border-emerald-200">
              PREVIEW
            </div>
            <div className="px-4 py-2 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              CUSTOMIZE
            </div>
            <div className="px-4 py-2 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              SEND
            </div>
          </div>

          {/* Screenshot */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-3xl blur-3xl opacity-30"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-4">
              <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl overflow-hidden">
                <Image
                  src="/screenshots/product-catalog.png"
                  alt="SignatureQuote Product Catalog Interface"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to quote faster
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built for solar professionals who value speed and accuracy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Lightning fast</h3>
              <p className="text-slate-600 leading-relaxed">
                Build complete quotes in under 60 seconds with our streamlined workflow and instant price updates.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Always current</h3>
              <p className="text-slate-600 leading-relaxed">
                Real-time pricing from Signature Solar ensures you always quote the right price. No more outdated catalogs.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Professional output</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate beautiful, branded PDFs that impress customers and win more business. Professional every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-emerald-200 transition-colors">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-slate-900">$29</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>50 quotes/month</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time pricing</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>PDF generation</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Email support</span>
                </li>
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6" asChild>
                <a href="/auth/sign-in">Get started</a>
              </Button>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-2xl p-8 border-2 border-emerald-600 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-slate-900">$79</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-slate-900">Unlimited quotes</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Custom branding</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Quote tracking</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6" asChild>
                <a href="/auth/sign-in">Get started</a>
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-emerald-200 transition-colors">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-slate-900">$199</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Multiple users</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6" asChild>
                <a href="/auth/sign-in">Contact sales</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to quote faster?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join solar professionals saving hours every week with SignatureQuote
          </p>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-10 py-7 rounded-xl"
            asChild
          >
            <a href="/auth/sign-in">Start free trial</a>
          </Button>
          <p className="text-sm text-slate-400 mt-8">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-lg font-bold text-white">SignatureQuote</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/products" className="hover:text-white transition-colors">Products</a>
              <a href="/auth/sign-in" className="hover:text-white transition-colors">Sign in</a>
            </div>
            <p className="text-sm text-slate-400">
              © 2025 SignatureQuote. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
