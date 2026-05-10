import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, ScrollText } from "lucide-react";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Terms & Conditions</h1>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Terms Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <ScrollText size={40} className="text-primary" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Last updated: January 2024
        </p>

        {/* Terms Content */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <section>
            <h3 className="font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
            <p className="text-sm text-muted-foreground">
              By accessing and using ApnaTrade, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">2. Eligibility</h3>
            <p className="text-sm text-muted-foreground">
              You must be at least 18 years old to use our services. By using ApnaTrade, you represent that you meet this age requirement.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">3. Account Security</h3>
            <p className="text-sm text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">4. Trading Risks</h3>
            <p className="text-sm text-muted-foreground">
              Trading involves significant risk and may not be suitable for all investors. You should carefully consider your financial situation before trading.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">5. Deposits & Withdrawals</h3>
            <p className="text-sm text-muted-foreground">
              All deposits are subject to verification. Withdrawals are processed within 24-48 hours after approval.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">6. Prohibited Activities</h3>
            <p className="text-sm text-muted-foreground">
              Users are prohibited from using automated systems, engaging in fraudulent activities, or attempting to manipulate the platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">7. Limitation of Liability</h3>
            <p className="text-sm text-muted-foreground">
              ApnaTrade shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">8. Contact Us</h3>
            <p className="text-sm text-muted-foreground">
              For any questions regarding these terms, please contact us at support@apnatrade.com
            </p>
          </section>
        </div>

        {/* Accept Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 bg-gradient-gold rounded-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          I Understand
        </button>
      </main>
    </div>
  );
};

export default TermsPage;
