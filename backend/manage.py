from backend.app import create_app

# Expose the Flask app instance for `flask --app manage ...` CLI usage.
app = create_app()

if __name__ == '__main__':
    # Run development server when executed directly
    app.run(host='127.0.0.1', port=8000)
