/* Customer-service bot: what the bot is allowed to know.
   Built from the public pages of the service (refund form, achievements, contact page). No personal or account data is included.
   The bot answers ONLY from this text. If the answer is not here, it says so and offers a human. Keep it short and factual, one fact per line.
   CONTACT_URL: the button shown when a human is needed. Leave '' for a demo, or use e.g. 'mailto:you@example.com'. */
export const CONTACT_URL = '';
export const KNOWLEDGE = `
# How the service works
MrCashback gives its members a refund (hyvitys, cashback) of money they have lost on deposits made at partner casinos.
To be eligible the member must become a customer of the casino through MrCashback, by going to the casino with the green button on the MrCashback site.
The member then sends a refund application (hyvityshakemus) in the MrCashback application form for each deposit.
The service is for persons aged 18 or older.

# Refund application: steps and rules
Before applying the member must verify their identity in the Identification (Tunnistautuminen / KYC) section. Applications are not processed before the identity has been verified. The service does not send a separate notice when the verification succeeds.
The form asks in steps: which casino the deposit was made at, and the deposit amount. The member must have made a deposit at the casino and lost the money.
By sending an application the member confirms that the information is correct. Giving false information can lead to the account being closed permanently without warning.
To confirm that an application is genuine, the service has to share some personal data with the partner casino (a third party). Only the necessary data is shared and it is not sold. More detail is in the terms of service.
Checking an application takes at least 24 hours.
Applications are processed every day between 12:00 and 22:59 Finnish time.

# Identity verification (KYC)
In the Identify yourself section the member uploads two images: a photo of an identity card or passport where the face and personal details are clearly visible, and a selfie where the member holds the identity document.
The check prevents fraud, meets regulatory requirements, protects minors and makes the account safer. The data is handled confidentially and used only for verification.

# Why an application can be rejected
A common reason: the service cannot see that the member came to the casino through the green button on MrCashback. Then the member is not recognised as a MrCashback customer and no refund can be granted.
To make sure the visit is recorded: do not use private browsing (for example incognito mode), do not use tracking protection software, do not visit the casino before pressing the green button, and do not block cookies on MrCashback or on the casino. Otherwise the data is not saved and a refund cannot be granted.
If an application is incomplete or has a comment from the service, the member should read the comment on the application and fix what is missing. The bot cannot see any individual application or account.

# Achievements and rewards (Saavutus- ja palkintoehdot)
Members can complete achievements and win cash rewards. Only basic cashback (normal approved refund applications) counts toward achievements. Full conditions are on the Achievements and rewards page.
Deposit total achievement: seven steps per casino, from depositing 250 euros (reward 25 euros) up to depositing 10,000 euros (reward 250 euros). Up to 850 euros per casino. Progress is counted from the deposit amounts of approved applications.
Deposit count achievement: four steps per casino, from 5 approved applications (reward 25 euros) to 40 approved applications (reward 100 euros). Each application must be at least 50 euros. Up to 250 euros per casino.
Invite friends: invite 5, 10 or 20 friends (rewards 50, 75 and 100 euros). A friend counts as invited after getting 3 approved applications (at least 50 euros each). There is also a separate 50 euro reward for each successfully invited friend.
Weekly and monthly achievements are renewed every week or month and require approved applications of at least 50 euros at several different casinos where the member has not played before.
Members also have levels (LVL). Completing the tasks of a level moves the member to the next level, which can bring higher cashback on approved applications.

# Contact and support
Live chat support is open Monday to Friday 08:00-16:00 Finnish time. Outside these hours the member can leave a message in the chat and it waits for the next working day. The bot cannot see accounts and cannot promise answer times.
Feedback and problem reports can be sent through the feedback form: title, free-form message and optionally up to two images (only .jpg and .png, maximum 10 MB each). It helps to tell which browser and device was used and how often the problem appears.

# If cashback has not arrived
Check that the identity verification is done, that the application has been sent for this deposit (one application per deposit), and that the application is not still waiting (checking takes at least 24 hours, processing happens daily 12:00-22:59 Finnish time).
If it still has not arrived, contact customer support and tell about the deposits and the play activity, and attach the needed proof (for example screenshots) so that eligibility can be checked.

# Responsible gambling (this part is real and should stay)
Gambling should be entertainment, never a way to earn money or to win back losses.
Players can set limits or exclude themselves from gambling at the casino where they play; the casino's own responsible-gambling settings are the place for this.
Free, confidential help in Finnish: Peluuri, https://www.peluuri.fi (helpline, chat and the OmaPeluuri self-help service). The current phone number and opening hours are on peluuri.fi.
If someone says they are in immediate danger, they should call the emergency number 112.
`;
