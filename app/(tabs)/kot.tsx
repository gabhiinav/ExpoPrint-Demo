// app/(tabs)/kot.tsx
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface Order {
  items: OrderItem[];
  tableNo: string;
  waiter: string;
  orderNo: string;
  timestamp: Date;
}

export default function KOTScreen() {
  const [order, setOrder] = useState<Order>({
    items: [],
    tableNo: "1",
    waiter: "John",
    orderNo: `KOT${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date(),
  });

  const [pdfUri, setPdfUri] = useState<string>("");

  const [menuItems] = useState<MenuItem[]>([
    { id: 1, name: "Burger", price: 5, category: "Fast Food" },
    { id: 2, name: "Fries", price: 3, category: "Sides" },
    { id: 3, name: "Coke", price: 2, category: "Beverages" },
    { id: 4, name: "Pizza", price: 12, category: "Fast Food" },
  ]);

  // Add to order function remains the same
  const addToOrder = (item: MenuItem) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.items.find((i) => i.id === item.id);

      if (existingItem) {
        return {
          ...prevOrder,
          items: prevOrder.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      } else {
        return {
          ...prevOrder,
          items: [...prevOrder.items, { ...item, quantity: 1 }],
        };
      }
    });
  };

  // Remove from order function remains the same
  const removeFromOrder = (itemId: number) => {
    setOrder((prevOrder) => ({
      ...prevOrder,
      items: prevOrder.items.filter((item) => item.id !== itemId),
    }));
  };

  const generateHtml = (): string => {
    return `
      <html>
        <head>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 10px; 
            }
            .divider { 
              border-top: 1px dashed black; 
              margin: 10px 0; 
            }
            .item { 
              margin: 5px 0;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              margin-top: 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>KITCHEN ORDER TICKET</h2>
            <p>Order #: ${order.orderNo}</p>
            <p>Table #: ${order.tableNo}</p>
            <p>Waiter: ${order.waiter}</p>
            <p>Time: ${order.timestamp.toLocaleTimeString()}</p>
          </div>
          <div class="divider"></div>
          ${order.items
            .map(
              (item) => `
            <div class="item">
              <strong>${item.quantity}x</strong> ${item.name}
            </div>
          `
            )
            .join("")}
          <div class="divider"></div>
          <div class="footer">
            <p>Total Items: ${order.items.reduce(
              (acc, item) => acc + item.quantity,
              0
            )}</p>
            <p>Printed: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const generatePDF = async (): Promise<string> => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: generateHtml(),
        base64: false,
      });

      // Generate a unique filename
      const filename =
        FileSystem.documentDirectory + `KOT_${order.orderNo}_${Date.now()}.pdf`;

      // Copy the file to documents directory
      await FileSystem.copyAsync({
        from: uri,
        to: filename,
      });

      return filename;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const sharePDF = async (uri: string) => {
    try {
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error sharing PDF:", error);
      Alert.alert("Error", "Failed to share PDF");
    }
  };

  const printKOT = async (): Promise<void> => {
    try {
      if (order.items.length === 0) {
        Alert.alert("Error", "Please add items to the order first");
        return;
      }

      // Generate and save PDF
      const pdfUri = await generatePDF();
      setPdfUri(pdfUri);

      // Print the PDF
      await Print.printAsync({
        uri: pdfUri,
      });

      // Show success message with share option
      Alert.alert(
        "Success",
        "KOT printed successfully! Would you like to share the PDF?",
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Share PDF",
            onPress: () => sharePDF(pdfUri),
          },
        ]
      );

      // Clear the order
      setOrder({
        ...order,
        items: [],
        orderNo: `KOT${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
      });
    } catch (error) {
      Alert.alert("Error", "Failed to print KOT");
      console.error(error);
    }
  };

  const previewKOT = async (): Promise<void> => {
    try {
      if (order.items.length === 0) {
        Alert.alert("Error", "Please add items to the order first");
        return;
      }

      // Generate PDF and show preview
      const pdfUri = await generatePDF();
      setPdfUri(pdfUri);

      await Print.printAsync({
        uri: pdfUri,
        preview: true, // This will show a preview instead of printing directly
      });
    } catch (error) {
      Alert.alert("Error", "Failed to preview KOT");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>KOT System</Text>
        <Text>Order #: {order.orderNo}</Text>
        <Text>Table #: {order.tableNo}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu Items</Text>
          <ScrollView style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => addToOrder(item)}
              >
                <Text>{item.name}</Text>
                <Text>${item.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.orderSection}>
          <Text style={styles.sectionTitle}>Current Order</Text>
          <ScrollView style={styles.orderList}>
            {order.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.orderItem}
                onPress={() => removeFromOrder(item.id)}
              >
                <Text>
                  {item.quantity}x {item.name}
                </Text>
                <Text>${(item.price * item.quantity).toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.previewButton]}
          onPress={previewKOT}
        >
          <Text style={styles.buttonText}>Preview KOT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.printButton]}
          onPress={printKOT}
        >
          <Text style={styles.buttonText}>Print KOT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    gap: 20,
  },
  menuSection: {
    flex: 1,
  },
  orderSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuList: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderList: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  printButton: {
    backgroundColor: "#4CAF50",
  },
  previewButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});