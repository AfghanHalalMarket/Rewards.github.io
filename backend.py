from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)

def get_db():
    """ Helper to connect to SQLite database """
    conn = sqlite3.connect("customers.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """ Display the leaderboard (ID, Name, Points, Tier) with sorting and pagination """
    page = request.args.get('page', 1, type=int)
    sort_by = request.args.get('sort_by', 'points')  # Sorting by points by default
    order = request.args.get('order', 'desc')  # Order is descending by default

    conn = get_db()
    cursor = conn.cursor()

    query = f"SELECT id, name, points, tier FROM customers ORDER BY {sort_by} {order} LIMIT 10 OFFSET ?"
    cursor.execute(query, ((page - 1) * 10,))
    leaderboard = cursor.fetchall()

    conn.close()

    # Get total count for pagination
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM customers")
    total = cursor.fetchone()[0]
    conn.close()

    total_pages = (total // 10) + (1 if total % 10 != 0 else 0)

    return render_template('index.html', leaderboard=leaderboard, total_pages=total_pages, page=page, sort_by=sort_by, order=order)

@app.route('/search', methods=['GET', 'POST'])
def search_customer():
    """ Search for a customer by name or phone number with pagination """
    page = request.args.get('page', 1, type=int)
    search_term = request.form.get('search_term') if request.method == 'POST' else request.args.get('search_term')

    if not search_term:
        return render_template('search.html', message="Please enter a search term.")

    conn = get_db()
    cursor = conn.cursor()

    # Sanitize input for SQL query
    search_term = "%" + search_term + "%"

    cursor.execute("SELECT * FROM customers WHERE name LIKE ? OR phone_number LIKE ? LIMIT 10 OFFSET ?", (search_term, search_term, (page - 1) * 10))
    customers = cursor.fetchall()

    conn.close()

    # Get total count for pagination
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM customers WHERE name LIKE ? OR phone_number LIKE ?", (search_term, search_term))
    total = cursor.fetchone()[0]
    conn.close()

    total_pages = (total // 10) + (1 if total % 10 != 0 else 0)

    return render_template('search.html', customers=customers, total_pages=total_pages, page=page, search_term=search_term)

@app.route('/customer/<int:customer_id>')
def customer_info(customer_id):
    """ Display detailed information for a specific customer """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE id=?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:
        return render_template('customer_info.html', customer=customer)
    else:
        return redirect(url_for('search_customer'))

if __name__ == "__main__":
    app.run(debug=True)
