#!/usr/bin/env python3
"""
Bcrypt Hashing Example - Similar to your Purple Player authentication
This demonstrates how password hashing works (same as your backend)
"""

import bcrypt

def hash_password(password):
    """Hash a password using bcrypt (same as backend)"""
    # Salt rounds = 10 (same as bcryptjs default in Node.js)
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed_password):
    """Verify a password against its hash (same as backend bcrypt.compare)"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def main():
    print("=" * 60)
    print("🔐 BCRYPT PASSWORD HASHING EXAMPLE (Purple Player Style)")
    print("=" * 60)
    print()
    
    # Example password
    password = "Abdul@4132"
    print(f"📝 Original Password: {password}")
    print()
    
    # Hash the password
    print("🔒 Hashing password...")
    hashed = hash_password(password)
    print(f"✅ Hashed Password: {hashed}")
    print()
    
    # Show that it's different every time (even for same password)
    print("🔄 Hashing same password again (notice it's different!):")
    hashed2 = hash_password(password)
    print(f"✅ Hashed Password 2: {hashed2}")
    print(f"   Different? {hashed != hashed2} (This is NORMAL for bcrypt!)")
    print()
    
    # Verify the password
    print("🔑 VERIFICATION TEST:")
    print(f"   Is '{password}' correct? {verify_password(password, hashed)}")
    print(f"   Is 'wrong' correct? {verify_password('wrong', hashed)}")
    print()
    
    # Show why decryption is impossible
    print("=" * 60)
    print("⚠️  WHY BCRYPT CANNOT BE DECRYPTED:")
    print("=" * 60)
    print("""
1. ✗ BCRYPT IS ONE-WAY: It's a hashing algorithm, not encryption
   - Encryption: plaintext ↔ ciphertext (reversible with key)
   - Hashing: plaintext → hash (IRREVERSIBLE by design)

2. ✗ NO ALGORITHM EXISTS: Even the creator cannot decrypt bcrypt hashes
   - The hash is mathematically irreversible
   - It's like turning an egg into an omelet - impossible to reverse

3. ✓ HOW VERIFICATION WORKS: Compare hashes instead
   - Hash stored: $2b$10$... (from your password)
   - Hash input: $2b$10$... (from login attempt)
   - They match? Password is correct!

4. ✓ PASSWORD RECOVERY: Only option is password reset
   - Send email with reset link
   - User creates NEW password
   - NEW hash is stored in database
""")
    
    # Practical example for your project
    print("=" * 60)
    print("💜 YOUR PURPLE PLAYER AUTHENTICATION FLOW:")
    print("=" * 60)
    print("""
REGISTRATION:
1. User enters password: "MyPurple@123"
2. Backend hashes it: await bcrypt.hash(password, 10)
3. Store hash in MongoDB: $2b$10$xyz...
4. Send user object back (NO password!)

LOGIN:
1. User enters email + password: "MyPurple@123"
2. Find user by email in MongoDB
3. Compare with backend: await bcrypt.compare(inputPassword, storedHash)
4. If match → Login success ✅
5. If no match → "Invalid email or password" ❌

FORGOT PASSWORD:
1. User clicks "Forgot Password"
2. Send reset link via email
3. User sets NEW password
4. Hash NEW password: await bcrypt.hash(newPassword, 10)
5. Update MongoDB with NEW hash
6. User can now login with new password
""")
    
    print()
    print("=" * 60)
    print("Summary: Bcrypt is secure BECAUSE it cannot be reversed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
