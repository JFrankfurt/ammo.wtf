import landingImage from "@/assets/landing-img.webp";
import { Button } from "@headlessui/react";
import { FC } from "react";

const Home: FC = () => {
  return (
    <div className="bg-slate-900 text-gray-200">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-slate-900 text-gray-200 shadow-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div>
            <a href="#home" className="text-2xl font-bold text-yellow-300">
              ammo.wtf
            </a>
          </div>
          <div>
            <Button className="mt-2 md:mt-0">Login</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="bg-slate-900 text-gray-200 h-screen flex flex-col md:flex-row items-center justify-center px-4 md:px-0 md:mx-20"
      >
        {/* Text Content */}
        <div className="flex flex-col items-center md:items-start justify-center gap-4 text-center md:text-left md:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold">
            Build your ammo supply
          </h1>
          <b>AMMO, AUTOMATED.</b>
          <p className="text-lg md:text-xl max-w-lg">
            Secure your ammo supply with an effortless, cost-effective solution
            for amassing ammunition. Automatically purchase ammo, store it
            safely, and have it delivered on demand.
          </p>
          <Button className="mt-4 border border-slate-200 rounded-xl py-2 px-4">
            Shop Now
          </Button>
        </div>

        {/* Image */}
        <div className="mt-8 md:mt-0 md:w-1/2 flex justify-center">
          <svg
            className="w-full h-full"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="theClippingPath">
                <path d="M62 13.001C62 33.4355 53.9345 64.001 33.5 64.001C13.0655 64.001 0 50.435 0 30.0005C0 9.56596 2.56546 4.00021 23 4.00021C43.4345 4.00021 62 -7.43358 62 13.001Z"></path>
              </clipPath>
            </defs>
            <image
              className="w-full h-full"
              clipPath="url(#theClippingPath)"
              xlinkHref={landingImage.src}
            />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-12 md:py-16 bg-gray-200 text-slate-900 px-4 md:px-0"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-electric-blue">
            Why choose us?
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto">
            We believe in delivering only the best. Our service ensures you
            never run out of ammunition, and always have the quality you expect
            delivered on time.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section
        id="products"
        className="py-12 md:py-16 bg-white text-slate-900 px-4 md:px-0"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-electric-blue">
            Your Ammo, Your Way
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto">
            At ammo.wtf, we empower you to build your ammunition stockpile
            according to your needs. Select from a range of popular calibers and
            allocate your budget with full control. We&apos;ll handle the
            storage and delivery, ensuring your ammo is ready when you are.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg border-2 border-electric-blue">
              <h3 className="text-xl md:text-2xl font-bold">
                Flexible Selection
              </h3>
              <p className="mt-2">
                Choose from our current offerings including 9mm, 5.56/.223, .45
                ACP, 300 Blackout, and .308 Win. Diversify your stockpile as we
                expand our inventory to include all major cartridges.
              </p>
            </div>
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg border-2 border-electric-blue">
              <h3 className="text-xl md:text-2xl font-bold">Tailored to You</h3>
              <p className="mt-2">
                Allocate your spending across different calibers based on your
                preferences. Customize your portfolio to match your specific
                shooting needs.
              </p>
            </div>
            <div className="bg-gray-200 p-6 rounded-lg shadow-lg border-2 border-electric-blue">
              <h3 className="text-xl md:text-2xl font-bold">
                Seamless Management
              </h3>
              <p className="mt-2">
                Manage your ammunition stockpile effortlessly. Adjust your
                allocations at any time, and request shipment of your stored
                rounds with a few clicks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-12 md:py-16 bg-gray-200 text-slate-900 px-4 md:px-0"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Flexible Ammunition Investment
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto text-slate-700">
            Allocate your ammo budget to your preferred calibers and types, and
            we&apos;ll store them securely until you&apos;re ready for delivery.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Example Pricing Cards */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-olive-green">
              <h3 className="text-xl md:text-2xl font-bold">
                Custom Allocation
              </h3>
              <p className="mt-2">
                Choose how much you want to invest each month. We&apos;ll
                allocate your budget across different types of ammunition based
                on your preferences.
              </p>
              <p className="mt-4 text-olive-green font-bold">
                Start with as little as $20/month
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-olive-green">
              <h3 className="text-xl md:text-2xl font-bold">
                Diversified Portfolio
              </h3>
              <p className="mt-2">
                Build a balanced ammunition stockpile by diversifying across
                various calibers and cartidge uses. We&apos;ll help you create a
                mix that suits your needs.
              </p>
              <p className="mt-4 text-olive-green font-bold">
                Adjust your allocation anytime
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-olive-green">
              <h3 className="text-xl md:text-2xl font-bold">
                On-Demand Shipping
              </h3>
              <p className="mt-2">
                Whenever you&apos;re ready, we&apos;ll ship all the ammunition
                you&apos;ve accumulated, straight to your door.
              </p>
              <p className="mt-4 text-olive-green font-bold">
                Free for shipments over $300
              </p>
              <Button className="mt-4">Request Shipment</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-12 md:py-16 bg-slate-900 text-gray-200 px-4 md:px-0"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Get in Touch</h2>
          <p className="mt-4 text-lg max-w-xl mx-auto">
            Have questions or need help? Contact our support team for
            assistance: support@ammo.wtf
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
