import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";

actor {
  // Store translation history
  private stable var translationHistory : [(Text, Text, Text)] = [];
  private let historyBuffer = Buffer.Buffer<(Text, Text, Text)>(0);

  // Initialize buffer with stable data
  private func loadStableData() {
    for ((source, target, translation) in translationHistory.vals()) {
      historyBuffer.add((source, target, translation));
    };
  };

  // Save history before upgrade
  system func preupgrade() {
    translationHistory := Buffer.toArray(historyBuffer);
  };

  // Reload history after upgrade
  system func postupgrade() {
    loadStableData();
  };

  // Add translation to history
  public shared func addTranslation(sourceText: Text, targetLang: Text, translatedText: Text) : async () {
    historyBuffer.add((sourceText, targetLang, translatedText));
  };

  // Get translation history
  public query func getHistory() : async [(Text, Text, Text)] {
    Buffer.toArray(historyBuffer)
  };
}
