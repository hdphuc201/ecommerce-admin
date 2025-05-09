🛒 Admin Dashboard – ECommerce
This is the Admin Panel for managing all core activities of an eCommerce system, including product, user, and order management. Built for flexibility and ease of use, it allows admins to efficiently control and monitor the business.

🚀 Features
📦 Product Management
View full list of products

Add new product (with name, price, stock, description, category, images)

Edit product details

Delete product

Upload images (Cloudinary or local)

Toggle product visibility (optional)

🧑‍💼 User Management
View all users

Search/filter by name or email

Edit user roles (Admin / Customer)

Delete users

View user activity or order history (optional)

🧾 Order Management
View all customer orders

Filter by order status (Pending / Paid / Shipped / Cancelled)

View order details (product, quantity, user, payment info)

Update order status

Cancel or refund orders (manual process)

📊 Dashboard Overview
Summary cards: total revenue, orders, users, products

Charts for sales trends and order volume (daily/weekly/monthly)

Low stock alert (products with low quantity)

Recent activity log (optional)

🔐 Authentication & Authorization
Login with email & password

Only users with isAdmin = true can access /admin

JWT-based authentication (token stored securely)

Route protection using middleware or guards