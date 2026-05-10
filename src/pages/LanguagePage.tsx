import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Check } from "lucide-react";
import { toast } from "sonner";

const LanguagePage = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "mr", name: "Marathi", native: "मराठी" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  ];

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    const lang = languages.find(l => l.code === code);
    toast.success(`Language changed to ${lang?.name}`);
  };

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
        <h1 className="text-xl font-bold text-foreground">Language</h1>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Language Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <Globe size={40} className="text-primary" />
          </div>
        </div>

        <p className="text-center text-muted-foreground">
          Select your preferred language
        </p>

        {/* Language Options */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-all ${
                index < languages.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="font-medium text-foreground block">{lang.name}</span>
                  <span className="text-xs text-muted-foreground">{lang.native}</span>
                </div>
              </div>
              {selectedLanguage === lang.code && (
                <Check size={20} className="text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground text-center">
            More languages coming soon!
          </p>
        </div>
      </main>
    </div>
  );
};

export default LanguagePage;
