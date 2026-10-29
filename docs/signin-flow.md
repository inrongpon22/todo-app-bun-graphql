# Sign-in flow

The user signs in with email and password, then confirms with a one-time code (OTP) sent to their email. Only accounts that are verified and approved by an admin (see [sign-up flow](signup-flow.md)) can sign in.

```mermaid
flowchart TD
    start([Start]) --> open[User opens sign-in page]
    open --> form["Enter email and password"]
    form --> submit[Submit to server]

    submit --> locked{Account locked<br/>after too many attempts?}
    locked -- Yes --> lockedMsg["Show 'Too many attempts, try again later'"]
    lockedMsg --> endLocked([End])
    locked -- No --> creds{Email and password<br/>match?}
    creds -- No --> countFail[Increase failed-attempt count]
    countFail --> credsErr["Show 'Invalid email or password'"]
    credsErr --> form

    creds -- Yes --> status{Account status?}
    status -- Unverified --> unverifiedMsg["Ask user to verify email first<br/>(offer to resend link)"]
    unverifiedMsg --> endUnverified([End])
    status -- Pending approval --> pendingMsg["Show 'Awaiting admin approval'"]
    pendingMsg --> endPending([End])
    status -- Rejected --> rejectedMsg["Show 'Account not approved'"]
    rejectedMsg --> endRejected([End])

    status -- Active --> genCode["Generate 6-digit code<br/>(store hashed, expires in 5 min)"]
    genCode --> sendCode[Email code to user]
    sendCode --> codeScreen[Show 'Enter the code' screen]
    codeScreen --> choice{User action}
    choice -- Resend --> cooldown{Resend cooldown<br/>passed?}
    cooldown -- No --> waitMsg["Show 'Wait before requesting a new code'"]
    waitMsg --> codeScreen
    cooldown -- Yes --> genCode

    choice -- Enter code --> expired{Code expired?}
    expired -- Yes --> expiredMsg["Show 'Code expired, request a new one'"]
    expiredMsg --> codeScreen
    expired -- No --> codeMatch{Code correct?}
    codeMatch -- No --> tooMany{Too many<br/>wrong codes?}
    tooMany -- No --> codeErr["Show 'Incorrect code'"]
    codeErr --> codeScreen
    tooMany -- Yes --> invalidate["Invalidate code and<br/>lock account temporarily"]
    invalidate --> endInvalid([End])

    codeMatch -- Yes --> consume["Mark code as used<br/>and reset failed attempts"]
    consume --> session[Create session / token]
    session --> app[Redirect to app, logged in]
    app --> endOk([End])

    classDef error stroke:#d33,stroke-width:2px
    class lockedMsg,credsErr,unverifiedMsg,pendingMsg,rejectedMsg,waitMsg,expiredMsg,codeErr,invalidate error
```
