from pure_app import app, ui

# Vercel needs to see a FastAPI `app` instance.
# NiceGUI's `app` object is a valid FastAPI application.
# Make sure ui.run() is NOT called when imported.

if __name__ != '__main__':
    # Initialize UI elements but don't run the uvicorn server
    pass
