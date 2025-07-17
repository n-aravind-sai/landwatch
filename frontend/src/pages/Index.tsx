import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Satellite, MapPin, Bell, Shield, Zap, Users, FileText, Eye, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-satellite.jpg';

const Index = () => {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Eye,
      title: "Detect Unauthorized Construction",
      description: "AI-powered satellite analysis identifies new structures on your land instantly"
    },
    {
      icon: MapPin,
      title: "Track Encroachments Over Time",
      description: "Monitor boundary changes and unauthorized occupation with historical comparisons"
    },
    {
      icon: Clock,
      title: "Access Historical Satellite Views",
      description: "Compare your land across months and years with our satellite archive"
    },
    {
      icon: FileText,
      title: "Securely Upload & Store Land Documents",
      description: "Keep all your property papers safe and accessible from anywhere"
    },
    {
      icon: Bell,
      title: "Receive Real-time Change Alerts",
      description: "Get notified immediately when any changes are detected on your property"
    },
    {
      icon: Shield,
      title: "Legal Documentation Support",
      description: "Export detailed reports and evidence for legal proceedings if needed"
    }
  ];

  const benefits = [
    {
      icon: Users,
      title: "No Agents or Middlemen",
      description: "Direct satellite monitoring without depending on local contacts"
    },
    {
      icon: Eye,
      title: "Full Transparency & Control",
      description: "See exactly what's happening on your land in real-time"
    },
    {
      icon: Zap,
      title: "AI-Powered Change Detection",
      description: "Advanced algorithms identify even subtle changes automatically"
    },
    {
      icon: MapPin,
      title: "Support for Multiple Land Parcels",
      description: "Monitor unlimited properties across different locations in India"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      location: "Dubai → Rajasthan",
      quote: "LandWatch helped me discover unauthorized construction on my farmland. I was able to take action before it became a major issue.",
      rating: 5
    },
    {
      name: "Priya Sharma",
      location: "London → Punjab", 
      quote: "As an NRI, I was always worried about my ancestral property. Now I have complete peace of mind with real-time monitoring.",
      rating: 5
    },
    {
      name: "Amit Patel",
      location: "Toronto → Gujarat",
      quote: "The historical satellite views helped me resolve a boundary dispute with concrete evidence. Invaluable service!",
      rating: 5
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Draw your land boundary",
      description: "Use our interactive map to outline your property boundaries with precision",
      icon: MapPin
    },
    {
      number: "02", 
      title: "Get notified of changes",
      description: "Our AI monitors your land 24/7 and alerts you of any unauthorized activity",
      icon: Bell
    },
    {
      number: "03",
      title: "Access anytime, anywhere",
      description: "View your plots, alerts, and documents from any device, anywhere in the world",
      icon: Satellite
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Satellite className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">LandWatch</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="btn-satellite" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hero-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Monitor Your Land from
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-secondary-light">
                Anywhere in the World
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Real-time satellite monitoring for NRIs to protect and manage their property in India
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button className="btn-alert text-lg px-8 py-4" asChild>
                <Link to="/register">
                  Start Monitoring <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20">
                Watch Demo
              </Button>
            </div>
            
            <div className="text-sm text-white/70">
              Trusted by 10,000+ NRIs worldwide • Starting from ₹99/month
            </div>
          </div>
        </div>
        
        {/* Floating satellite animation */}
        <div className="absolute top-20 right-10 hidden lg:block">
          <Satellite className="h-16 w-16 text-white/20 float-animation" />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-satellite group-hover:shadow-satellite-xl transition-smooth">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Protect What Matters Most</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive satellite monitoring for every aspect of your land security
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="feature-card group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose LandWatch</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets practical solutions for modern land management
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 bg-card rounded-2xl shadow-satellite">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by NRIs Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real stories from property owners who found peace of mind with LandWatch
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="feature-card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <CheckCircle key={i} className="h-5 w-5 text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-gradient-space text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Protect Your Investment Today
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Advanced satellite monitoring starts from just ₹99/month
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button className="btn-alert text-lg px-8 py-4" asChild>
                <Link to="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20">
                View Pricing Plans
              </Button>
            </div>
            <p className="text-sm text-white/70">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Monitor Your Land?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of NRIs who trust LandWatch to protect their property investments
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex max-w-md w-full">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-l-xl border-0 text-foreground"
              />
              <Button className="btn-alert rounded-l-none px-6 py-3" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Satellite className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">LandWatch</span>
              </div>
              <p className="text-muted-foreground">
                Satellite-powered land monitoring for NRIs worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">How it Works</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Legal</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Privacy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">About</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 LandWatch. All rights reserved. Made for NRIs, by technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
