import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { 
  Eye, 
  Edit3, 
  Play, 
  Save, 
  RotateCcw, 
  Copy, 
  Sparkles, 
  Zap,
  TestTube,
  AlertTriangle
} from "lucide-react";
import { AlertDialog } from "./dialog";
import { useDialogs } from "../../hooks/useDialogs";
import { useAgentName } from "../../utils/agentName";
import ReasoningService, { DEFAULT_PROMPTS } from "../../services/ReasoningService";

interface PromptStudioProps {
  className?: string;
}


export default function PromptStudio({ className = "" }: PromptStudioProps) {
  const [activeTab, setActiveTab] = useState<"current" | "edit" | "test">("current");
  const [editedAgentPrompt, setEditedAgentPrompt] = useState(DEFAULT_PROMPTS.agent);
  const [editedRegularPrompt, setEditedRegularPrompt] = useState(DEFAULT_PROMPTS.regular);
  const [testText, setTestText] = useState("Hey Assistant, make this more professional: This is a test message that needs some work.");
  const [testResult, setTestResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { alertDialog, showAlertDialog, hideAlertDialog } = useDialogs();
  const { agentName } = useAgentName();

  // Load saved custom prompts from localStorage
  useEffect(() => {
    const savedPrompts = localStorage.getItem("customPrompts");
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts);
        setEditedAgentPrompt(parsed.agent || DEFAULT_PROMPTS.agent);
        setEditedRegularPrompt(parsed.regular || DEFAULT_PROMPTS.regular);
      } catch (error) {
        console.error("Failed to load custom prompts:", error);
      }
    }
  }, []);

  const savePrompts = () => {
    const customPrompts = {
      agent: editedAgentPrompt,
      regular: editedRegularPrompt
    };
    
    localStorage.setItem("customPrompts", JSON.stringify(customPrompts));
    showAlertDialog({
      title: "Prompts sauvegardés !",
      description: "Vos prompts personnalisés ont été sauvegardés et seront utilisés pour tous les futurs traitements IA."
    });
  };

  const resetToDefaults = () => {
    setEditedAgentPrompt(DEFAULT_PROMPTS.agent);
    setEditedRegularPrompt(DEFAULT_PROMPTS.regular);
    localStorage.removeItem("customPrompts");
    showAlertDialog({
      title: "Réinitialisation terminée",
      description: "Les prompts ont été réinitialisés aux valeurs par défaut."
    });
  };


  const testPrompt = async () => {
    if (!testText.trim()) return;
    
    setIsLoading(true);
    setTestResult("");
    
    try {
      // Check if reasoning model is enabled and if we have the necessary settings
      const useReasoningModel = localStorage.getItem("useReasoningModel") === "true";
      const reasoningModel = localStorage.getItem("reasoningModel") || "gpt-3.5-turbo";
      const reasoningProvider = localStorage.getItem("reasoningProvider") || "openai";
      
      if (!useReasoningModel) {
        setTestResult("⚠️ AI text enhancement is disabled. Enable it in AI Models settings to test prompts.");
        return;
      }
      
      // Check if we have the required API key
      const apiKey = reasoningProvider === "openai" 
        ? localStorage.getItem("openaiApiKey")
        : localStorage.getItem("anthropicApiKey");
        
      if (!apiKey || apiKey.trim() === "") {
        setTestResult(`⚠️ No ${reasoningProvider === "openai" ? "OpenAI" : "Anthropic"} API key found. Add it in AI Models settings.`);
        return;
      }
      
      // Save current prompts temporarily so the test uses them
      const currentCustomPrompts = localStorage.getItem("customPrompts");
      localStorage.setItem("customPrompts", JSON.stringify({
        agent: editedAgentPrompt,
        regular: editedRegularPrompt
      }));
      
      try {
        // Call the AI - ReasoningService will automatically use the custom prompts
        const result = await ReasoningService.processText(testText, reasoningModel);
        setTestResult(result);
      } finally {
        // Restore original prompts
        if (currentCustomPrompts) {
          localStorage.setItem("customPrompts", currentCustomPrompts);
        } else {
          localStorage.removeItem("customPrompts");
        }
      }
      
    } catch (error) {
      console.error("Test failed:", error);
      setTestResult(`❌ Test échoué : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showAlertDialog({
      title: "Copié !",
      description: "Prompt copié dans le presse-papiers."
    });
  };

  const renderCurrentPrompts = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          Prompts IA actuels
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Ce sont les prompts exacts actuellement envoyés à vos modèles IA. Les comprendre vous aide à voir comment OpenWispr réfléchit !
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Prompt du mode Agent (quand vous dites "Hey {agentName}")
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 border rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{editedAgentPrompt.replace(/\{\{agentName\}\}/g, agentName)}</pre>
          </div>
          <Button 
            onClick={() => copyPrompt(editedAgentPrompt)} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copier le prompt
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-green-600" />
            Prompt du mode Normal (pour le nettoyage automatique)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 border rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{editedRegularPrompt}</pre>
          </div>
          <Button 
            onClick={() => copyPrompt(editedRegularPrompt)} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copier le prompt
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderEditPrompts = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-indigo-600" />
          Personnaliser vos prompts IA
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Modifiez ces prompts pour changer le comportement de votre IA. Utilisez <code>{"{{agentName}}"}</code> et <code>{"{{text}}"}</code> comme espaces réservés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt du mode Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedAgentPrompt}
            onChange={(e) => setEditedAgentPrompt(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder="Entrez votre prompt d'agent personnalisé..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt du mode Normal</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedRegularPrompt}
            onChange={(e) => setEditedRegularPrompt(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder="Entrez votre prompt normal personnalisé..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={savePrompts} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder les prompts personnalisés
        </Button>
        <Button onClick={resetToDefaults} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser par défaut
        </Button>
      </div>
    </div>
  );


  const renderTestPlayground = () => {
    const useReasoningModel = localStorage.getItem("useReasoningModel") === "true";
    const reasoningModel = localStorage.getItem("reasoningModel") || "gpt-3.5-turbo";
    const reasoningProvider = localStorage.getItem("reasoningProvider") || "openai";
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-green-600" />
            Tester vos prompts
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Testez vos prompts personnalisés avec le modèle IA réel pour voir les résultats.
          </p>
        </div>

        {!useReasoningModel && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Amélioration de texte IA désactivée</p>
                <p className="text-sm text-amber-700 mt-1">
                  Activez l'amélioration de texte IA dans les paramètres des modèles IA pour tester les prompts.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Modèle actuel :</span>
                <span className="ml-2 font-medium">{reasoningModel}</span>
              </div>
              <div>
                <span className="text-gray-600">Fournisseur :</span>
                <span className="ml-2 font-medium capitalize">{reasoningProvider}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Texte de test</label>
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                placeholder="Entrez du texte pour tester vos prompts personnalisés..."
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Essayez d'inclure "{agentName}" dans votre texte pour tester les prompts du mode agent
                </p>
                {testText && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    testText.toLowerCase().includes(agentName.toLowerCase())
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {testText.toLowerCase().includes(agentName.toLowerCase())
                      ? "🤖 Mode Agent"
                      : "✨ Mode Normal"}
                  </span>
                )}
              </div>
            </div>

            <Button 
              onClick={testPrompt} 
              disabled={!testText.trim() || isLoading || !useReasoningModel}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? "Traitement avec l'IA..." : "Tester le prompt avec l'IA"}
            </Button>

            {testResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Réponse de l'IA</label>
                  <Button
                    onClick={() => copyPrompt(testResult)}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`border rounded-lg p-4 text-sm max-h-60 overflow-y-auto ${
                  testResult.startsWith("⚠️") || testResult.startsWith("❌")
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <pre className="whitespace-pre-wrap">{testResult}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={className}>
      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => !open && hideAlertDialog()}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: "current", label: "Prompts actuels", icon: Eye },
          { id: "edit", label: "Personnaliser", icon: Edit3 },
          { id: "test", label: "Tester", icon: TestTube }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "current" && renderCurrentPrompts()}
      {activeTab === "edit" && renderEditPrompts()}
      {activeTab === "test" && renderTestPlayground()}
    </div>
  );
}
