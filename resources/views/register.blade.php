<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <link rel="stylesheet" href="{{ asset('css/register.css') }}">
</head>
<body>
    <div class="register-form">
        <a href="/login" class="back-to-login">&larr; Back to Login</a>
        <h2>Create your account</h2>
        <form id="input-form" action="/register" method="POST">
            @csrf
            <div class="form-group">
                <label for="first_name">First name</label>
                <input type="text" id="first_name" name="first_name" placeholder="Enter your first name">
            </div>
            <div class="form-group">
                <label for="last_name">Last Name</label>
                <input type="text" id="last_name" name="last_name" placeholder="Enter your last name">
            </div>
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Type your username">
            </div>
            <div class="form-group">
                <label for="email">E-mail</label>    
                <input type="email" id="email" name="email" placeholder="Type your e-mail">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Type your password">
                <p class="password-hint">Must be 8 characters at least</p>
            </div>
        </form>
        <form id="button-form" action="/register" method="POST">
            @csrf
            <button type="submit">Create</button>
        </form>
        <p class="login-link">Already have an account? <a href="/login">Sign In</a></p>
    </div>
</body>
</html>