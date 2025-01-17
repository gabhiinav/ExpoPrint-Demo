import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      {/* Your other tabs */}
      <Tabs.Screen
        name="kot"
        options={{
          title: "KOT",
          // Add any icons or other options you want
        }}
      />
    </Tabs>
  );
}