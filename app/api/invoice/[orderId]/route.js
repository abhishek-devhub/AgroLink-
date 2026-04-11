import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { orderId } = await params;

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // Format invoice data
    const invoiceData = {
      invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
      invoiceDate: new Date(order.createdAt).toLocaleDateString("en-IN"),
      completionDate:
        order.status === "completed"
          ? new Date(order.updatedAt).toLocaleDateString("en-IN")
          : null,

      // Farmer Details
      farmerName: order.farmerName,
      farmerDistrict: order.farmerDistrict || "Not specified",
      farmerState: order.farmerState || "Not specified",

      // Buyer Details
      buyerName: order.buyerName,
      buyerId: order.buyerId.toString(),

      // Order Details
      crop: order.crop,
      variety: order.variety || "Not specified",
      quantity: order.quantity,
      unit: order.unit === "kg" ? "kg" : "quintal",
      grade: order.grade || "A",
      agreedPrice: order.agreedPrice,
      totalAmount: order.totalAmount || order.agreedPrice * order.quantity,

      // Payment Details
      paymentStatus: order.paymentStatus === "paid" ? "Paid" : "Pending",
      paymentMethod: order.payment?.method || "Digital Payment",
      razorpayPaymentId: order.payment?.razorpayPaymentId || "N/A",
      paidAt: order.payment?.paidAt
        ? new Date(order.payment.paidAt).toLocaleDateString("en-IN")
        : null,

      // Status
      orderStatus: order.status,
      createdAt: new Date(order.createdAt),
    };

    return Response.json({ success: true, data: invoiceData });
  } catch (err) {
    console.error("Invoice API error:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
