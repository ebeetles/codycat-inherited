# Game Spec: Cozy Cat Café

## 1. What is the game?

A companion-style cat café management game that can stay open for long periods. The player runs a small shop that takes in stray cats, looks after the cats, serves customers, and uses the shop's income to improve the cats' lives.

The game uses a cozy 2D top-down view. Cats move freely around the shop, and customers arrive on their own. The player can click occasionally to care for the cats and manage the shop, or simply leave the game running in the foreground and watch the cats and customers go about their day.

- **What the player does:** refills cat food, pets cats, takes in randomly appearing strays, serves customers, and buys facilities.
- **Why it's fun:** waiting for a new cat to show up brings surprise; different cats gradually make the shop livelier; income can be spent on improving the shop, creating a steady sense of growth.
- **Goal:** keep the cats in good condition and gradually grow the little shop into a lively cat café.
- **Failure condition:** there is no forced failure or game over. Cats never die and never leave permanently because the player stops interacting for a while.
- **Platform:** desktop web browser, mouse controls.
- **Core version scope:** one cat café scene, with the starting cat, cat care, random strays, customer spending, and the coin loop.
- **Implementation:** any tech stack, but the README must give clear steps to start the game.

## 2. Core gameplay and rules

### 2.1 Starting state

A new game starts with:

- 100 coins.
- One guaranteed orange tabby cat named "Cream" (奶油).
- One food bowl and two customer seats.
- Room for at most 3 cats.

### 2.2 Cat companionship and care

- Adopted cats automatically walk around, pause, or sleep inside the shop.
- Each cat has its own fullness value, ranging from 0 to 100, starting at 100.
- Fullness drops by 1 every 10 seconds, to a minimum of 0.
- Clicking "Refill food" costs 10 coins and adds 30 fullness to every adopted cat, up to a maximum of 100.
- Clicking a cat shows its name and fullness, with a heart effect.
- A cat with fullness below 30 shows a hunger marker.
- Even at 0 fullness, a cat does not die or leave.

### 2.3 Taking in strays

- When no stray is waiting, a random check runs every 60 seconds, with a 50% chance of a stray appearing.
- The stray appears at the shop door. The player can choose "Adopt" or "Not now".
- Adopting is free. Once adopted, the stray enters the shop with 100 fullness.
- When the shop has reached 3 cats, the "Adopt" button is disabled and the message "The café is full" is shown.
- At most one stray can be at the door at a time; no new stray spawns until the current one is handled.
- After a stray is adopted or turned away, the timer for the next appearance check restarts from that moment.
- Strays have at least 3 visually distinct appearances, chosen at random each time; repeats are allowed.
- Each cat has its own identity and name, and tracks its own fullness, even if two cats look the same.

### 2.4 Customers and income

- The game tries to spawn a customer every 20 seconds.
- If a seat is free, the customer enters and takes a seat; if all seats are taken, no customer spawns that time.
- A customer stays for 30 seconds, shown drinking coffee or playing with cats, then pays automatically and leaves.
- Each customer's base payment is 20 coins.
- At checkout, the customer pays 5 extra coins for each cat whose fullness is 30 or higher.
- Coins are added immediately at checkout, and the seat becomes free again.
- Hungry cats do not stop customers from coming or paying the base amount, so the player can always earn back the coins needed for food.

### 2.5 Continuous running

- While the game is open and in the foreground, cat activity, customer arrivals, and timers keep running on their own.
- The player is not required to act often, and there are no countdown tasks.
- In the P0 version, the simulation pauses when the tab is in the background and resumes when it returns to the foreground, without catching up on time spent in the background.
- In the P0 version, closing or refreshing the page starts a new game; saving is P1 and offline earnings are P2.

## 3. Full feature list

P0 is the core version; P1 and P2 are later extensions.

| Feature | Details | Priority |
|---|---|---|
| Main café scene | Shop interior, door, food bowl, two seats | P0 |
| Starting cat | Orange tabby "Cream" given at the start | P0 |
| Autonomous cat behavior | Cats walk, pause, and sleep on their own | P0 |
| Cat care | Fullness, refilling food, hunger marker | P0 |
| Click interaction | View cat info, heart effect on click | P0 |
| Random strays | Appear by the rules above; adopt or turn away | P0 |
| Customer system | Arrive, take a seat, stay, pay, leave | P0 |
| Coin system | Show balance, handle income and food costs | P0 |
| Feedback messages | "Not enough coins", "The café is full", etc. | P0 |
| Local save | Auto-save coins, cats, and upgrades | P1 |
| Facility upgrades | More seats and more cat capacity | P1 |
| Cat collection book | Record adopted cats and their descriptions | P1 |
| Sound settings | Background music, meows, mute button | P1 |
| Decoration system | Buy and place cat beds, rugs, plants, etc. | P2 |
| Cat personality and affection | Different activity preferences; interaction raises affection | P2 |
| Offline earnings | On reopening, pay out up to 2 hours of business income | P2 |
| Expanded management | More drinks, staff, and shop expansion | P2 |

## 4. Acceptance criteria

### P0: Core version, must be completed

1. After starting the project with the steps in the README, the game opens in a desktop browser with no sign-up or login.
2. A new game shows 100 coins, one orange tabby named "Cream", two empty seats, and a cat count of `1/3`.
3. Without any input, cats automatically switch between walking, pausing, and sleeping inside the shop; walking never leaves the shop's activity area.
4. Clicking any adopted cat shows that cat's name, current fullness, and a short heart effect.
5. Each cat's fullness starts at 100, drops by 1 every 10 seconds, and never goes below 0.
6. A cat with fullness below 30 shows a hunger marker; the marker disappears once fullness is back to 30 or higher.
7. With at least 10 coins, clicking "Refill food" deducts 10 coins and adds 30 fullness to every adopted cat, never exceeding 100.
8. With fewer than 10 coins, clicking "Refill food" shows "Not enough coins", and neither coins nor fullness change.
9. When no stray is waiting, the game runs an appearance check every 60 seconds with a 50% chance; at most one stray is at the door at a time.
10. Strays have at least 3 visually distinct appearances; each cat has its own identity, name, and fullness.
11. With fewer than 3 cats, clicking "Adopt" moves the stray at the door into the shop, increases the cat count by 1, leaves coins unchanged, and gives the new cat 100 fullness.
12. With 3 cats, the "Adopt" button is disabled and "The café is full" is shown.
13. Clicking "Not now" makes the stray at the door disappear; existing cats and coins do not change.
14. After a stray is adopted or turned away, the next appearance check happens 60 seconds later.
15. Every 20 seconds, a customer spawns if a seat is free; if no seat is free, that spawn is skipped. There are never more than two customers in the shop.
16. A customer stays seated for 30 seconds, then pays and leaves. The payment is `20 + 5 × (number of cats with fullness of 30 or higher at checkout)`.
17. Each customer's payment is counted only once; after they leave, their seat can be used by later customers.
18. When a cat's fullness reaches 0, it stays in the shop, and the game still lets customers arrive and pay and lets the player refill food.
19. After running in the foreground for 10 continuous minutes, cat activity, customer arrivals, and coin changes still work correctly, with no double charges and no capacity overflows.
20. The simulation pauses when the tab goes to the background and resumes when it returns; coins, fullness, and event timers do not catch up on background time.
21. The README explains how to verify random events, for example a test mode that can force a stray to appear; normal mode still uses the specified random chance.

### P1: Add after the core is done

22. After refreshing the page, coins, adopted cats, and their fullness are restored to the most recent save; the starting coins and "Cream" are not given again. Current customers and a waiting stray do not need to be saved.
23. Paying 100 coins upgrades seats from 2 to 3; paying 150 coins raises the cat limit from 3 to 5. Each upgrade can be bought only once and cannot be bought without enough coins.
24. The collection book shows cats that have been adopted, with descriptions; cats not yet adopted are shown as locked.
25. The mute button turns off all background music and sound effects; clicking it again turns them back on.

### P2: Later extensions

26. The player can buy at least 3 kinds of decorations and place them in unoccupied decoration slots; a successful purchase is charged only once.
27. There are at least two cat personalities, each affecting rest duration or movement frequency; clicking a cat increases and displays that cat's affection.
28. On reopening the game, the player receives 10 coins per full minute offline, up to 120 minutes; the same offline period is paid out only once, and fullness does not drop while offline.
29. The player can unlock at least one new drink, one staff member who refills food automatically, and one shop expansion; prices and effects are clearly shown before purchase.

## 5. Priorities and what to cut if time runs short

### Build order

1. Main scene, starting cat, and autonomous behavior.
2. Fullness, refilling food, and the coin display.
3. Customer arrival, checkout, and leaving, to complete the business loop.
4. Random strays, adoption, and the capacity limit.
5. Verify all of P0, then add saving and other extensions.

### What to cut first

1. Cut P2 first: expanded management, offline earnings, personality and affection, decorations.
2. Then cut P1: sound, collection book, facility upgrades, saving.
3. Simplify the art: cats and customers can be static icons that move; states like sleeping or drinking coffee can be shown with text or small icons.

### Minimum deliverable

Complete all of P0. The player can watch cats act on their own, care for them, take in new cats, and earn income from customers.
