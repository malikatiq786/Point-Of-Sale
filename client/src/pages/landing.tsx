import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Store, 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Package, 
  CreditCard,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: ShoppingCart,
      title: "Modern POS Terminal",
      description: "Lightning-fast checkout with barcode scanning, receipt printing, and multiple payment methods."
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Real-time stock tracking, low-stock alerts, and automated reordering capabilities."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive sales reports, customer insights, and business intelligence dashboards."
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Track customer purchases, preferences, and build lasting relationships."
    },
    {
      icon: CreditCard,
      title: "Multi-Payment Support",
      description: "Accept cash, cards, mobile payments, and digital wallets seamlessly."
    },
    {
      icon: Store,
      title: "Multi-Store Support",
      description: "Manage multiple locations from a single, unified dashboard."
    }
  ];

  const benefits = [
    "Increase sales by 25% with faster checkout times",
    "Reduce inventory costs by 15% with smart tracking",
    "Save 10+ hours per week on manual reporting",
    "Improve customer satisfaction with personalized service",
    "Scale your business across multiple locations",
    "Secure data with enterprise-grade encryption"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Universal POS</h1>
            </div>
            <Button onClick={() => window.location.href = "/api/login"} className="bg-primary-500 hover:bg-primary-600">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The Modern POS System 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Built for Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your business operations with our comprehensive point-of-sale solution. 
              From inventory management to customer analytics, everything you need in one beautiful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                className="bg-primary-500 hover:bg-primary-600 text-lg px-8 py-4"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to simplify your operations and accelerate growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="border-0 shadow-soft hover:shadow-md transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Businesses Choose Universal POS
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of successful businesses that have transformed their operations with our platform.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                className="mt-8 bg-primary-500 hover:bg-primary-600"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="lg:pl-12">
              <Card className="shadow-soft border-0">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex text-warning-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">4.9/5 from 2,847 reviews</span>
                  </div>
                  
                  <blockquote className="text-lg text-gray-700 mb-6 italic">
                    "Universal POS transformed our business. We've seen a 40% increase in efficiency 
                    and our customers love the faster checkout experience."
                  </blockquote>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">JD</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">John Doe</p>
                      <p className="text-gray-600">CEO, Retail Plus</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of businesses already using Universal POS to drive growth and efficiency.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            Get Started Now - It's Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-primary-200 mt-4 text-sm">
            No credit card required • 14-day free trial • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Universal POS</span>
          </div>
          <p className="text-gray-400">
            © 2024 Universal POS. All rights reserved. Built with modern technology for modern businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}