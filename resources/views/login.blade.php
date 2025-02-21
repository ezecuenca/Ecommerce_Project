<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Watchdogs</title>
    <link rel="stylesheet" href="{{ asset('css/login.css') }}">
</head>
<body>
    <div class="container">
        <div class="left-panel">
            <div class="logo">
                <img src="{{ asset('images/watchdogs_logo.svg') }}" alt="Your Logo">
            </div>
        </div>
        <div class="right-panel">
            <div class="login-form">
                <h2>Welcome back!</h2>
                <p>Timeless Style, Just a Click Away!</p>
                <form>
                    <div class="form-group">
                        <label for="email">E-mail</label>
                        <input type="text" id="email" placeholder="Type your username or e-mail">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="Type your password">
                        <a href="#" class="forgot-password">Forgot Password?</a>
                    </div>
                    <button type="submit">Sign In</button>
                </form>
                <p class="signup-link">Don't have an account? <a href="/register">Sign Up</a></p>
            </div>
        </div>
    </div>
</body>
</html>