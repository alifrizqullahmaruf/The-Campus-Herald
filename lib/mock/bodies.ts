// Bodies of the sample articles, in HTML the editor can open (it saves list
// items as <li><p>, which looks the same). Each has
// quotes from the people in the story, one pull quote, a short fact list and
// a closing paragraph of its own. The excerpt is shown as the lead above the
// body, so a body starts after it. Lengths follow the kind of piece: news
// (Events, Achievements) about 300 words, features (Academics, Organisations)
// about 500, opinion about 600. Unpublished articles read like their status:
// drafts are half written, the rejected one lacks what the review asks for.
// Only elements the editor can produce (no links). Replaced in Phase 2.

const p = (text: string) => `<p>${text}</p>`;
const pull = (text: string) => `<blockquote><p>${text}</p></blockquote>`;
const list = (label: string, items: string[], ordered = false) => {
  const tag = ordered ? "ol" : "ul";
  return `<p><strong>${label}</strong></p><${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
};
/** A note the author left in a draft. */
const todo = (text: string) => `<p><em>[${text}]</em></p>`;
const html = (...blocks: string[]) => blocks.join("");

export const BODIES: Record<number, string> = {
  // Academics (features)
  1: html(
    p(
      "None of them owned anything expensive. When we visited the five students at the top of their year, we expected standing desks, two monitors and a wall of colour-coded files. Instead we found borrowed lamps, second-hand chairs and kitchen tables. What they shared was not equipment but a habit: one notebook per course, a written plan for the week, and the phone face down until the plan was done.",
    ),
    p(
      "“I write the week on one page every Sunday evening,” said Anisa Maharani, a third-year accounting student who has topped her cohort twice. “If it is not on the page, it does not happen. If it is on the page, I do not have to remember it.” Her desk is a folding table by the window of a shared boarding house. The page sits under a clip on the left, the notebook for the day's first lecture on the right.",
    ),
    p(
      "Galih Wicaksono, a second-year civil engineering student, keeps a single pen and a single pencil on his desk and puts everything else in a drawer. “If I can see five highlighters, I spend ten minutes choosing a colour,” he said. He studies in fifty-minute blocks and stands up at the end of each one, even in the middle of a problem. “Stopping halfway makes it easier to start again.”",
    ),
    pull("The desk does not make you smart. It just stops you from starting late."),
    p(
      "The phone came up in every conversation. All five keep it out of reach while they work, face down or in another room. Nanda Kusuma, a fourth-year law student, puts hers in a shoebox on top of the wardrobe. “It is not that I have amazing self-control,” she said. “I just made it annoying to get to.”",
    ),
    p(
      "Yosua Simanjuntak, a third-year mathematics student, keeps his desk at home empty apart from a lamp. He studies at the same library table every evening, where the notebook, the weekly plan and a bottle of water come out of his bag. “Home is for sleeping,” he said. “If I study in bed, I end up doing neither.”",
    ),
    list("What we saw on most desks", [
      "One notebook per course, never a shared one",
      "A written plan for the week, on paper",
      "A glass of water and nothing to snack on",
      "A few coloured pens, never a whole set",
      "The phone face down, or out of the room",
      "A lamp, because evening study needs good light",
    ]),
    p(
      "Dr. Siti Rahmawati, who teaches the study skills course for first-year students, was not surprised. “Students often think the top of the class has a secret method,” she said. “Usually it is the same method everyone knows, done every day without negotiating with yourself.” She recommends starting with the weekly plan: it takes fifteen minutes and makes every other habit easier.",
    ),
    p(
      "None of the five claimed their desk was the reason for their grades. But all of them said it was the reason they started on time. If you want to try one thing this week, try Anisa's Sunday page. You only need a pen, a sheet of paper and the phone somewhere else.",
    ),
  ),
  2: html(
    p(
      "From the car park at midnight, the science building looks like a city that never sleeps. Hundreds of windows stay lit long after the last lecture, and behind most of them is a student waiting for an experiment that cannot be paused. We spent a night shift with them, from eight in the evening until the first bus at five.",
    ),
    p(
      "Some samples have to be checked every three hours, so the labs keep a rota of volunteers who sleep on camping mats between readings. The rota is a spreadsheet pinned to the door of the third-floor common room, and it fills up weeks ahead of exam season. “You learn to fall asleep in eleven minutes,” said Bayu Saputra, a fourth-year microbiology student, rolling out his mat under a bench. “The alarm does the rest.”",
    ),
    p(
      "On the fourth floor, Fitri Ramadhani was feeding cell cultures that need fresh medium twice a night. Her thesis depends on cells that have been growing for six weeks. “If I skip one feeding, I lose a month,” she said. “So I do not skip. I bring tea and a podcast, and I do the feeding at midnight and at four.”",
    ),
    p(
      "At two, the third-floor common room fills with the smell of instant noodles. Students from labs that never meet during the day sit around the same table, swapping complaints about centrifuges and advice about supervisors. “The night shift is the only time I talk to anyone from physics,” Fitri said. “Some of my best ideas came from people who do not even work on cells.”",
    ),
    pull("At 3 a.m. every lit window is someone waiting for a result."),
    p(
      "The night shift has its own rules. Nobody works alone on a floor, everyone signs in at the security desk, and the building's technician, Hendra Kusnadi, leaves his phone number on every lab door. He has worked nights here for nine years. “The students think I am checking on them,” he said. “I am mostly checking the freezers. But I also make sure they eat.”",
    ),
    list("A night in the building", [
      "8 p.m.: the last lecture ends and the night rota begins",
      "Every three hours: samples checked and logged",
      "Midnight and 4 a.m.: cell cultures fed on the fourth floor",
      "2 a.m.: instant noodles in the third-floor common room",
      "5 a.m.: the first bus home; the day staff arrive at seven",
    ]),
    p(
      "Not everyone thinks the lights should stay on. The faculty's sustainability group has asked for motion sensors in the corridors, so that only the rooms in use stay lit. The dean's office says the sensors will be installed over the semester break, starting with the stairwells. “Nobody is asking the labs to switch off their freezers,” said Tiara Kusumaningrum, who leads the group. “We are asking empty corridors to stop lighting themselves.”",
    ),
    p(
      "By five, the windows start going dark one by one as samples are logged and mats are rolled up. Bayu caught the first bus with his eyes half closed. “Tonight it is someone else's turn,” he said. “Tomorrow it is mine again.”",
    ),
  ),
  3: html(
    p(
      "The change follows a semester of entry data that showed the room was full every evening and nearly empty in the first hours of the morning. Staff hours have been moved rather than cut, so the room now opens at ten instead of eight.",
    ),
    p(
      "“We followed the footsteps,” said Wulan Sari, the head of reader services, pointing at a chart printed from the gate counters. Between eight and ten in the morning, fewer than twenty people came through the doors. Between eight and ten at night, the room was full and students were sitting on the floor of the corridor outside. “Students read late, so we stay late.”",
    ),
    p(
      "The room has a hundred and twenty seats, long oak tables and a strict silence rule that is enforced mostly by glances. The late opening covers the reading room only. The rest of the library, including the borrowing desk and the printers, still closes at eight, and books can only be borrowed until then. Students who arrive after eight enter through the side door by the bicycle racks, where a guard checks student cards.",
    ),
    pull("We followed the footsteps. Students read late, so we stay late."),
    p(
      "For many students the late hours are the only quiet hours they have. Rizky Hidayat, a second-year history student, shares a rented room with two others. “At home there is always a TV on or someone on a call,” he said. “Here I can read for three hours without anyone talking to me. That is worth the walk back in the dark.”",
    ),
    p(
      "That walk was the first worry students raised when the change was announced. The library has added a second guard after ten, and the campus shuttle now makes an extra stop outside the main entrance at a quarter past twelve. “If we keep the room open, we have to get people home safely too,” Wulan Sari said. “The shuttle was the condition, not an extra.”",
    ),
    p(
      "Not every reader is happy. A few early risers have written to the library asking for the morning hours back, and the library says it will look at the numbers again at the end of the semester. Wulan Sari said the decision is not fixed. “If the mornings fill up, we will move again. We would rather follow the students than a timetable.”",
    ),
    list("The new hours", [
      "Reading room: 10 a.m. to midnight, Monday to Friday",
      "Weekends: 9 a.m. to 5 p.m., unchanged",
      "Borrowing desk and printers: until 8 p.m.",
      "After 8 p.m.: side entrance by the bicycle racks, student card required",
      "Review of the hours: at the end of the semester",
    ]),
    p(
      "The first week of late opening went quietly, which is exactly the point. On Thursday night at a quarter to twelve, the guard switched the lights off one row at a time, and the last dozen readers packed up without a word.",
    ),
  ),
  4: html(
    p(
      "Every semester, the course registration portal opens at eight in the morning, and every semester a few hundred first-year students spend the day fixing mistakes they made in the first five minutes. It does not have to be that way. With one laptop, one study plan and twenty minutes, registration is the easiest admin you will do all year.",
    ),
    p(
      "Most problems come from registering before your academic advisor approves the study plan. The portal lets you pick courses before approval, but it drops them again the moment the plan is rejected, and by then the popular classes are full. “Every year we see students who did the clicking first and the thinking second,” said Melati Ayuningtyas, who coordinates academic advising for the first-year programme.",
    ),
    list(
      "How to register without the drama",
      [
        "Write your course choices on paper, with a back-up for every class",
        "Book fifteen minutes with your academic advisor in the week before registration",
        "Wait for the approval email before you open the portal",
        "Log in ten minutes early and check that your student number is linked",
        "Register for your required courses first, electives second",
        "Download the confirmation and keep it until the end of the semester",
      ],
      true,
    ),
    p(
      "The busiest moment is the first hour. Classes with small groups, like the introductory chemistry labs and the first-year writing seminar, are often full by nine. “If you only remember one thing: required courses first,” said Andika Saputra, a second-year management student who volunteers at the registration help desk. “Electives can wait. They are rarely full on the first day.”",
    ),
    p(
      "The second most common mistake is a clash. The portal warns you when two classes meet at the same time, but not when a lecture and its lab are on opposite sides of campus with ten minutes in between. “Open the weekly view before you confirm,” said Reza Mahendra, head of digital services, whose office runs the portal. “If two blocks touch and the buildings are far apart, choose a different section now. Changing later is much harder.”",
    ),
    pull("Plan on paper, then click. Never the other way round."),
    p(
      "If something goes wrong, the help desk in the student centre is open from eight until four during registration week, and the IT office keeps a chat line open until ten at night. Mistakes can be fixed during the two-week add and drop period, but only if the class still has seats, so it pays to get the first round right.",
    ),
    p(
      "Mega Puspita, a first-year psychology student, registered last week in eighteen minutes. “I was so nervous I wrote everything down twice,” she said. “Then I clicked through the list and it was done before my tea was cold. My roommate did it the other way round and spent the afternoon at the help desk.”",
    ),
    p(
      "Registration for next semester opens in January. If you are a first-year student, book your advisor meeting before the holidays: the slots in the last week before registration always go first.",
    ),
  ),

  // Organisations (features)
  5: html(
    p(
      "For as long as anyone can remember, the student council has met in borrowed classrooms, packing up its posters every evening before the cleaners arrived. This semester that changed. The council now has a bright meeting room on the ground floor of the student centre, with a long table, white chairs and a door that locks.",
    ),
    p(
      "The room used to store old furniture. When the student centre was renovated last year, the council asked whether it could have the space if members cleared and painted it themselves. They did, over two weekends, with paint bought from the council's own budget and chairs rescued from a lecture hall that was being refitted. “We carried out forty broken desks and carried in twelve good chairs,” said Fajar Nugroho, the council president.",
    ),
    p(
      "The painting weekends became a small event of their own. Members of other clubs turned up with brushes, the hiking club lent its ladders, and the canteen sent over a box of fried bananas on the second Sunday. The walls are now pale yellow, chosen by a vote in the council's group chat. “We argued about the colour for longer than we painted,” Fajar said.",
    ),
    pull("For the first time we have a table nobody can ask us to leave."),
    p(
      "The council has decided the room should not belong only to the council. Any of the forty registered student clubs can book it for free, for up to three hours at a time, through a shared calendar outside the council office. In the first month, the debate club, the hiking club and the Muslim students' association all used it for planning meetings, and the photography club borrowed it to sort prints for its exhibition.",
    ),
    p(
      "“We used to meet in the canteen and shout over the coffee machine,” said Dinda Kartika, secretary of the hiking club. “Now we have a whiteboard and a door. Our meetings take half as long.”",
    ),
    p(
      "Not everything is finished. The room still has no projector, and the wifi signal drops near the window. The council has asked the student centre for a projector in next year's budget, and in the meantime members bring their own laptops and crowd around one screen. Clubs are also asked to leave the room as they found it: there is a cleaning checklist on the back of the door.",
    ),
    list("Booking the room", [
      "Who: any registered student club, free of charge",
      "When: Monday to Saturday, 8 a.m. to 9 p.m.",
      "How long: up to three hours per booking",
      "How: write your club and time on the calendar outside the council office",
      "House rules: chairs back, whiteboard wiped, lights off",
    ]),
    p(
      "On a Thursday evening, three clubs had booked the room back to back. The council itself met afterwards, at nine, around the long table its members had carried in. “For the first time we have a table nobody can ask us to leave,” Fajar said, and nobody had to pack up a poster.",
    ),
  ),
  6: html(
    p(
      "Every Wednesday at four, a dozen students in a small room on the third floor of the arts building switch off their laptops and take turns at three old typewriters. The machines were donated by a retired literature lecturer who wrote her own books on them, and they now belong to the writing club, which has met here for six years.",
    ),
    p(
      "The club has one rule: no deleting. Whatever goes on the page stays there. There is no backspace, no undo and no moving a paragraph somewhere better. “It makes you slower, and slower turns out to be good,” said Salsa Anindya, the club's coordinator and a third-year literature student.",
    ),
    pull("You cannot press undo, so you think before every sentence."),
    p(
      "Members write in twenty-minute turns while the others read, plan or wait with a notebook. The rhythm of the room is set by the machines: the clack of the keys, the bell at the end of a line, the scrape of the carriage return. New members often find it loud. “The first week I could not hear my own thoughts,” said Farhan Akbar, a first-year engineering student who joined to practise writing in English. “Now I miss the noise when I write at home.”",
    ),
    p(
      "At the end of each month, the club pins its best pages to the noticeboard outside the room, mistakes and all. Crossed-out words are left as they are. Some of the pinned pages have become short stories in the student magazine, and two members had poems published in a national anthology last year.",
    ),
    p(
      "The lecturer who donated the machines, Hartini Wijaya, still visits once a month to read the noticeboard. She taught literature here for thirty years and wrote three novels on the heaviest of the typewriters. “I was going to give them to a museum,” she said. “Then I realised a museum would only look at them. These students make them work for a living.”",
    ),
    p(
      "Keeping the machines running is a hobby of its own. Ribbons are ordered online from one of the few shops that still stock them, and one of the three typewriters has a sticky letter E that needs a firm push. The club has a small toolbox and a manual from 1978, and Farhan has become the unofficial repair person. “I study machines anyway,” he said. “These are just older ones.”",
    ),
    list("How the club works", [
      "When: Wednesdays, 4 p.m. to 6 p.m., arts building room 3.12",
      "Who can join: any student, no experience needed",
      "The rule: no deleting; mistakes stay on the page",
      "Turns: twenty minutes per writer per machine",
      "Every month: the best pages go on the noticeboard",
    ]),
    p(
      "The club is looking for new members and, if anyone has one in an attic, a fourth typewriter. Salsa says the waiting list for a turn is getting long. “Laptops are faster,” she said. “That is exactly why we keep these.”",
    ),
  ),
  10: html(
    p(
      "The cameras sit on three long shelves in the ground-floor gallery, each with a small handwritten card. The exhibition is the work of the photography club, which spent most of last semester collecting, cleaning and repairing them.",
    ),
    p(
      "Most of the collection was donated by alumni who found the cameras in attics, garages and their parents' cupboards after the club posted an appeal in the alumni newsletter. Some arrived with film still inside. “One camera had a roll from 1987 in it,” said Arya Wirawan, the club's chair and a fourth-year visual communication student. “We developed it. It was a birthday party. We found the family and sent them the prints.”",
    ),
    pull("Every camera here has taken somebody's first photo."),
    p(
      "Each camera has a small card with its year, its make and, where the donor knew it, a short story: who owned it, where it travelled, what it photographed. A folding camera from the 1950s belonged to a former lecturer who carried it on a research trip. A plastic point-and-shoot from the 1990s was a donor's first camera, bought with her own pocket money.",
    ),
    p(
      "More than two hundred people came to the opening night, and many of them were not students. Retired lecturers and alumni walked the shelves slowly, stopping at the models they once owned. The favourite so far is a twin-lens camera from 1957 that you look down into rather than through. “Older visitors stop at the cameras they grew up with and tell us stories we never knew,” Arya said. “We have started writing them down for the cards.”",
    ),
    p(
      "Club members cleaned and repaired the cameras themselves, with help from a camera shop owner in town who taught them how to replace light seals. About a dozen still work. Visitors can book a guided shoot with one of them: the club provides a real roll of film, a member walks with you around campus, and the prints are ready a week later. “People are surprised by how slow it is,” said Sari Wijayanti, a second-year member who leads the shoots. “Twenty-four photos, no screen, no second chances. You look much harder before you press the button.”",
    ),
    list("Visiting the exhibition", [
      "Where: arts building gallery, ground floor",
      "When: weekdays, 10 a.m. to 5 p.m., for two weeks",
      "Entry: free",
      "Guided film shoot: book at the front desk, film included, prints after a week",
      "Donations: the club still accepts old cameras, working or not",
    ]),
    p(
      "The club hopes to make the collection permanent. It has asked the arts faculty for a glass cabinet in the building's lobby, and in the meantime the cameras will go back into their boxes when the exhibition closes. Arya says the boxes are not the end of the story. “A camera is meant to be used,” he said. “We will keep shooting with the ones that work.”",
    ),
  ),

  // Events (news)
  7: html(
    p(
      "More than three thousand visitors came to Saturday's open day, the busiest the university has had in years. The doors opened at eight, and by nine the queue for a campus map reached the car park. Volunteers handed out maps from a folding table by the gate.",
    ),
    p(
      "Student guides stood at the top and bottom of every escalator, and each faculty ran a tour every half hour. The busiest moment came just after lunch, when four tour groups met in the same hall. “We stopped counting at the doors when the clicker passed three thousand,” said Tegar Ramadhan, a third-year student who coordinated the volunteers.",
    ),
    pull("We stopped counting at the doors when the clicker passed three thousand."),
    p(
      "For many visitors, the guides were the highlight. Nur Aisyah, a high school student who travelled four hours with her mother, said the brochure covered the courses but the guide answered everything else. “She told us where to eat, which dorms are quiet and which lecturers give the best notes,” she said.",
    ),
    p(
      "Engineering and medicine had the longest queues for tours, while the arts faculty's open studio drew the biggest crowd of the afternoon, with visitors trying screen printing at long tables. The admissions desk ran out of scholarship brochures by two and switched to handing out a printed link instead.",
    ),
    list("Open day in numbers", [
      "Over 3,000 visitors through the main doors",
      "120 student volunteers in yellow shirts",
      "A tour every 30 minutes from each faculty",
      "Busiest time: 1 p.m., with four groups in the main hall at once",
    ]),
    p(
      "The university plans a second entrance and timed bookings for tours next year, so the main hall is less crowded after lunch. Volunteers for next year's open day can sign up at the student centre from March. Former volunteers say it is the best way to see the campus through new eyes.",
    ),
  ),
  8: html(
    p(
      "Music night is back. After a two-year break, six student bands played to a crowd of around two thousand on the main field on Friday, under stage lights borrowed from the theatre department and with food stalls run by student organisations.",
    ),
    p(
      "The event moved outdoors to fit more people. Gates opened at six, the first band started at seven and the last encore ended just before ten, when the field had to be cleared. “We wanted it loud but safe,” said Dimas Prasetyo, the stage manager and a third-year electrical engineering student. “Every cable was taped down twice. Nobody tripped, so I am calling it a success.”",
    ),
    pull("We just wanted the field to sound like a campus again."),
    p(
      "The line-up ranged from acoustic folk to a metal band from the engineering faculty that closed the night. Between sets, the student radio station ran a quiz on the big screen. Bagas Pratomo, a first-year student at his first music night, stayed until the end. “I came for one band and stayed for all six,” he said.",
    ),
    p(
      "The food stalls did almost as well as the bands. The satay stall run by the hiking club sold out before the second set, and the club says the money will pay for its next mountain trip. “We made three hundred sticks and thought it was too many,” said its treasurer, Galang Putra. “By eight we were apologising to the queue.”",
    ),
    list("The night at a glance", [
      "6 student bands, from acoustic folk to metal",
      "About 2,000 people on the main field",
      "12 food stalls run by student organisations",
      "Gates at 6 p.m., first band at 7 p.m., field cleared by 10 p.m.",
    ]),
    p(
      "The organisers want music night twice a year. Bands that want to play next semester can sign up with the music society; auditions are held in its rehearsal room in February.",
    ),
  ),
  9: html(
    p(
      "The fair ran from nine until four on Tuesday, with stands from banks, tech firms, manufacturers and two hospitals. Here is what we saw, aisle by aisle, and what to do differently next time.",
    ),
    p(
      "The busiest corner belonged to a tech company handing out stickers, while some of the quietest stands were the firms actually hiring that week. By three o'clock the hall was so full that the doors closed for twenty minutes. “The students who did best walked straight past the giveaways,” said Yudi Pranoto from the careers office, who has organised the fair for six years.",
    ),
    pull("The free tote bag line was longer than the interview line."),
    p(
      "Several companies ran short interviews on the spot. Rina Setiawati, a final-year accounting student, left with two interview invitations. “I printed ten CVs and researched five companies the night before,” she said. “I went to those five first, before the hall filled up.”",
    ),
    p(
      "One of the quiet stands belonged to a regional bank with twenty graduate positions open. “We spoke to fewer than fifty students all day,” said Lukas Hartono, its recruiter. “The stand next to us gave away phone holders and had a queue around the pillar.” He has already booked the same spot for the next fair, with a bigger sign that says the bank is hiring.",
    ),
    list("Next year, do this", [
      "Arrive before 10 a.m., while the hall is quiet",
      "Bring about ten printed copies of your CV",
      "Read the list of companies hiring now, published a week before",
      "Visit the hiring stands first and the giveaways later",
    ]),
    p(
      "The careers office will publish the exhibitors for next semester's fair in February, with a note on which companies have open positions. Its CV clinic in the student centre runs every Thursday afternoon until then. Bring a printed CV and twenty minutes; the advisers will mark it up in red pen.",
    ),
  ),
  11: html(
    p(
      "Cultural week ended on Saturday night with a parade of regional costumes, a shared stage by the lake and, for the first time, ten minutes of fireworks over the water.",
    ),
    p(
      "Each faculty hosted one evening during the week, with dances, music and food from the regions its students come from. On the closing night every performance group shared the stage by the lake. “It is the one week everyone on campus is in the same place,” said Intan Permatasari, chair of the organising committee.",
    ),
    pull("It is the one week everyone on campus is in the same place."),
    p(
      "The fireworks were the week's biggest surprise: the committee kept them secret until the last song ended. “We needed permission from campus security, the fire department and the people who run the boats on the lake,” Intan said. “Three meetings and a lot of forms for ten minutes. Worth every one of them.”",
    ),
    p(
      "Earlier in the evening, the costume parade took almost an hour to walk from the main gate to the lake, with students dressed in clothing from across the archipelago. Yohana Rumbiak, a first-year student from Papua, wore a beaded headdress her grandmother made for a family wedding. “I almost did not bring it to campus,” she said. “Tonight I was glad I did.”",
    ),
    list("Cultural week in brief", [
      "7 evenings, one hosted by each faculty",
      "More than 20 performance groups on the closing night",
      "A costume parade from the main gate to the lake",
      "10 minutes of fireworks, a first in the event's history",
    ]),
    p(
      "Photos from the week will be shown in the student centre next month. The committee is already collecting ideas for next year and says it would like more food stalls and fewer speeches. Suggestions can be left in the box by the student centre entrance until the end of the month.",
    ),
  ),

  // Opinion (essays)
  12: html(
    p(
      "Every weekday at a quarter to nine, the queue at the coffee bar in the faculty building reaches the stairs. I have stood in it for two years, and I have watched friends give up and go to their nine o'clock lecture without breakfast. We are often told that the solution is patience: leave earlier, wait calmly, stop complaining. I disagree, and I have a notebook of timings to explain why.",
    ),
    p(
      "Look at who is in the queue. Half of it is waiting for slow pour-over coffee, carefully made by one barista at one counter. The other half only wants to pay for a bottle of water or a packaged sandwich. Both halves stand in the same line, behind the same people, and the person who wants water waits five minutes for coffee they did not order.",
    ),
    p(
      "Splitting the two would cut waiting time without hiring anyone or changing the menu. One till for anything already in the fridge, one counter for anything that has to be made. Supermarkets worked this out decades ago with express lanes. Banks did it with numbered tickets. Our coffee bar still treats a bottle of water and a hand-poured coffee as the same job.",
    ),
    pull("Nobody ever fixed a bottleneck by asking people to be calmer."),
    p(
      "I timed the queue for one week, standing nearby with a notebook. On an average morning, about sixty people joined it between half past eight and nine. Roughly half bought something that only needed paying for. Each of those payments took a few seconds; each coffee took about a minute to make. But every order goes through the one till next to the machine, so the person with a bottle of water waits behind every coffee ahead of them. With a second till for grab-and-go items, those thirty people would be out in minutes, and the coffee queue would be half as long.",
    ),
    p(
      "The barista, Joko Susanto, who has worked at the bar for five years, agrees with me more than I expected. “I can see the people with water bottles in the queue,” he told me. “I feel bad for them. But there is one till, and it is next to the machine.” The till is the problem, not the people, and certainly not Joko.",
    ),
    p(
      "When I shared my timings in a class group chat, the replies came fast. “I have missed the start of two lectures this month standing behind a latte,” wrote Hana Pertiwi, a second-year pharmacy student. Another classmate, Danu Aryasatya, had simply stopped trying: he now buys water from a vending machine two buildings away. Neither of them is impatient. They just have somewhere to be at nine.",
    ),
    p(
      "There are objections. The bar is small, and a second till needs space. But the corner by the fridge is used for nothing except stacking boxes, and a card reader needs about as much space as a lunch tray. Another objection is staff: who would run the second till? At peak time, nobody needs to. A self-service card reader for packaged items would do the job, as it already does in the library café.",
    ),
    list("What I'm proposing", [
      "A second till by the fridge for packaged items, from 8 to 10 a.m.",
      "Card or QR payment only at that till, so it stays fast",
      "A sign at the stairs: coffee to the left, everything else to the right",
      "A two-week trial, with the queue timed before and after",
    ]),
    p(
      "I have sent this proposal to the faculty's facilities office, together with my notebook of timings. A trial would cost almost nothing and take two weeks. If I am wrong, we go back to one queue and I will stand in it without a word.",
    ),
    p(
      "But I do not think I am wrong. You fix a queue by looking at what it is made of, and ours is made of two different queues pretending to be one.",
    ),
  ),
  13: html(
    p(
      "Every group project I have done has had one person who disappears. They come to the first meeting, nod at everything, take on a part with great enthusiasm and then vanish until the night before the deadline, when they send three paragraphs copied from a website. I have been in nine group projects at this university. In seven of them, someone disappeared. In two of them, that someone was me, and I am not proud of it.",
    ),
    p(
      "The problem is not that students are lazy. The problem is that group projects begin with good intentions and no agreement. Most groups plan around a table in the first week, phones and tablets out and everyone full of energy. Somebody says they can do the research and somebody else offers to do the slides, and nobody writes it down, because writing it down feels like we do not trust each other.",
    ),
    p(
      "Then week three arrives. The research is half done, the slides are waiting for the research, and nobody remembers who promised what. Arguments start, usually by chat message at midnight, and they are about memory, not work. “I thought you said you would do the conclusion.” “I said I would help with it.” Nobody can prove anything, so the most patient person ends up doing everything.",
    ),
    pull("Write it down while everyone still likes each other."),
    p(
      "A one-page contract on day one would fix most of this. Not a legal document, just a page: who does what, by when, how the group will talk to each other and what happens if someone misses a deadline. It turns later arguments into a simple check against the page. It also protects the quiet members, because the loud ones cannot quietly hand them extra work.",
    ),
    p(
      "Some lecturers already do this. Dr. Siti Rahmawati asks every group in her study skills course to hand in a short agreement in week two, signed by everyone. “The complaints I get about free riders dropped to almost nothing,” she told me. “The work did not get easier. The expectations got clearer.”",
    ),
    p(
      "Last semester my own group tried it, without being asked. We wrote the page in fifteen minutes at the end of our first meeting, half as a joke, and everyone signed it with a different coloured pen. In week four one of us missed a deadline. Instead of a midnight argument, we opened the page, saw that the agreed fix was a message to the group and a new date, and moved on. “I was embarrassed for about ten minutes,” said Stefanus Tanjung, the group member in question. “Then it was just a new date. Nobody had to be angry.”",
    ),
    p(
      "Students worry that a contract will make the group feel cold. In my experience it does the opposite. When everyone knows what they owe, there is less to argue about and more time to enjoy working together. The contract is not about distrust. It is about not having to rely on anyone's memory, including your own.",
    ),
    list("What I'm proposing", [
      "A one-page agreement in the first week of every group project",
      "Four questions: who does what, by when, how we talk, what happens if a deadline is missed",
      "Signed by everyone and sent to the lecturer",
      "A check against the page halfway through the project",
    ]),
    p(
      "So here is my suggestion for every course with group work: make the page part of the assignment, even if it is worth only one per cent of the grade. Students will roll their eyes, fill it in and forget about it. Then in week three, when someone disappears, the group will open the page and know exactly what to do next.",
    ),
  ),
  14: html(
    p(
      "Last semester I sat four exams at eight o'clock on a Saturday morning. Each time, the room was full of tired faces. Some of my classmates had come straight from a night shift. Others had swapped their weekend shift with a colleague and would lose the pay. None of this needed to happen.",
    ),
    p(
      "Many students at this university take weekend jobs to pay for rent and books. They work in cafés, shops and warehouses, or as private tutors, often on Saturday mornings because that is when employers need them most. When an exam lands on that slot, they have to choose between income and grades. Some lose a day's wages. Some lose a job. Some come to the exam having slept three hours.",
    ),
    p(
      "The strange part is that weekday slots sit empty. When I asked the faculty's exam office about the timetable, a staff member showed me the room bookings for exam week. On Tuesday and Wednesday afternoons, several large rooms were unused. The Saturday slots exist because they have always existed, not because the calendar is full.",
    ),
    pull("A timetable is a choice, and this one chooses badly."),
    p(
      "I spoke to students who work weekends. Arif Kurniawan, a third-year mechanical engineering student, works at a hardware store every Saturday. “My manager is kind about it, but he cannot give me every exam morning off,” he said. “Last semester I lost three shifts. That is a week of food.”",
    ),
    p(
      "Tari Puspitasari, a fourth-year education student, tutors high school students on Saturday mornings. Her pupils have their own exams coming, and cancelling a lesson means letting them down. “I moved two lessons to Sunday night last semester,” she said. “My students were tired, I was tired, and I still took my exam on four hours of sleep. Everybody lost.”",
    ),
    p(
      "When I asked the exam office why Saturdays are used at all, the answer was honest: it makes the exam period one day shorter, so marking can start sooner. That is a fair aim. But the cost of that one day is paid by the students who can least afford it, and the marking could start just as soon if the empty weekday afternoons were used first.",
    ),
    p(
      "There is also a question of fairness. Students who do not need to work can rest on Friday night and arrive fresh. Students who do work arrive tired, or not at all. A timetable that falls hardest on the students with the least money is not neutral, even if nobody designed it to be unfair.",
    ),
    p(
      "The usual objection is that weekday exams clash with lectures. But lectures stop during exam week. Another is that there are not enough rooms. The bookings say otherwise. A third is that some large courses need the biggest hall, which is booked on weekdays. That may be true for two or three courses. It is not true for the dozens that currently sit on Saturdays.",
    ),
    list("What I'm proposing", [
      "No exams on Saturday mornings, starting next semester",
      "Fill the empty Tuesday and Wednesday afternoon slots first",
      "Where a Saturday exam cannot be avoided, a second sitting on a weekday",
      "A short survey of working students before the timetable is fixed",
    ]),
    p(
      "I am not asking for easier exams or fewer of them. I am asking for exams at times when every student can show up rested. The exam office has said it will review the timetable for next semester. I hope it starts with the weekday rooms that are already sitting empty.",
    ),
  ),

  // Achievements (news)
  15: html(
    p(
      "Six months after launch, the app Ilham Maulana built in his dorm room runs on the university's official servers, and the IT office has quietly dropped its own plans for one.",
    ),
    p(
      "The app puts timetables, room bookings and the canteen menu in one place. Ilham built the first version over a semester break and shared it with his class, who shared it with theirs. Within a month half the faculty was using it.",
    ),
    pull("I built it because I was tired of opening four websites before breakfast."),
    p(
      "The university's IT office noticed. Instead of building its own app, it invited Ilham to move his onto the official servers and gave him access to the room booking system. “It was better than anything we had planned,” said Reza Mahendra, head of digital services. “We checked that it was secure and let him keep improving it.”",
    ),
    p(
      "The most used feature is the canteen menu, opened more than a thousand times before lunch on a normal weekday. Ilham says the hardest part was not the code but the data: every faculty kept its timetables in spreadsheets with a different layout. “I spent more time cleaning tables than writing code,” he said. “I know every room number on this campus now.”",
    ),
    list("The app in numbers", [
      "8,000 users, about half of all students",
      "Timetables, room bookings and the canteen menu in one place",
      "First version built in 10 weeks on a second-hand monitor",
      "Now hosted on the university's servers",
    ]),
    p(
      "Ilham still updates the app from the same desk. Next on his list is a map of free study rooms, updated every fifteen minutes. He is looking for two students to help, and says patience with bug reports matters more than experience. Anyone interested can find him, he says, at the same desk, most evenings after nine.",
    ),
  ),
  16: html(
    p(
      "The three environmental science students, Laila Fitriani, Rendi Setiadi and Clara Wulandari, heard on Monday that their grant application had been accepted in full.",
    ),
    p(
      "The project began as a class assignment last year. “It started as homework,” said Laila, who leads the team. “We kept going after the grade came back because the river was worse than we expected.”",
    ),
    p(
      "The students will sample the water at six points every month and record what they find on the banks, from bottle caps to old fishing nets. The data will go to the local council, which has asked for it to plan clean-ups. A volunteer group in the village downstream has already offered to help collect the larger pieces. Their supervisor, Dr. Anton Wiryawan, said the project was unusual for undergraduates. “They are doing the work of a small research team, and they are doing it properly.”",
    ),
    p(
      "Their first survey, done for the class, found plastic at every point they checked, most of it food packaging that washes down from a road bridge upstream. “We expected the bridge,” said Rendi Setiadi, who did most of the sampling. “We did not expect the middle of the forest.” The grant pays for sampling kits, laboratory analysis and a trip to present the results at a national conference.",
    ),
    pull("It started as homework. Now it is a map the city can use."),
    list("The project at a glance", [
      "3 students, one year of fieldwork",
      "6 sampling points along the river",
      "Monthly samples, published on a shared online map",
      "Data shared with the local council for its clean-ups",
    ]),
    p(
      "The team is looking for volunteers for its first big sampling day next month. No experience is needed, only boots and a willingness to get wet. Volunteers will be trained on the riverbank on the morning itself, and lunch is provided by the faculty.",
    ),
  ),
  17: html(
    p(
      "It is the first regional title for a band from this campus, and it came at the band's first attempt.",
    ),
    p(
      "The Late Drafts have four members, and two of them joined only this semester. They played three songs of their own, and the judges singled out the last one, written the night before the final. “We wrote our best song the night before,” said Rara Anjani, the band's singer and a second-year communications student.",
    ),
    pull("We wrote our best song the night before. Please do not tell our lecturers."),
    p(
      "The guitarist, Dion Prakoso, said the rehearsal room made the difference. “We could practise every evening for free,” he said. “Most bands in the final pay for studio time. We just booked the room on the music society's calendar.”",
    ),
    p(
      "The final took place in a concert hall in the city, in front of about eight hundred people. The Late Drafts went on eleventh of thirteen, after a long wait backstage. “I counted the ceiling lights to calm down,” said the drummer, Satria Nugraha. “Then the first chord hit and I forgot I was nervous.” The judges announced the result after midnight. The band celebrated with fried rice from a street stall outside the hall, still holding the trophy.",
    ),
    list("The win in brief", [
      "13 bands in the regional final",
      "3 original songs, one written the night before",
      "Prize: a day of professional recording and a slot at a city festival",
      "Rehearsals: every evening in the music society's room",
    ]),
    p(
      "The band will record its first single with the prize next month. Its next campus show is at music night next month, and the music society says the rehearsal room is booked every evening until then. The society is now asking the faculty for a second room, so that newer bands get a chance to practise too.",
    ),
  ),
  18: html(
    p(
      "The jury of three concert pianists watched Kirana Dewanti play for an hour and a half without once looking at a page.",
    ),
    p(
      "She practised six hours a day on the old upright piano in the music society's room, the same one she learned on in her first year. The scholarship covers two years at a conservatory. “That piano has a sticky key,” she said. “I learned to play around it.”",
    ),
    pull("That piano has a sticky key. I learned to play around it."),
    p(
      "Her programme included Bach, Chopin and her own arrangement of a piece by an Indonesian composer. Her teacher, Ratna Handayani, a lecturer in the music department, said the arrangement impressed the jury. “Anyone can play fast,” she said. “Kirana plays as if she is telling you something.”",
    ),
    p(
      "Kirana only started piano at fifteen, late by conservatory standards, and she failed her technique exam in her first semester. She retook it, then practised scales every morning before lectures for a year. Her classmates remember her as the first person in the music society room every morning, often before the cleaners. “I learned that a bad exam is not a bad musician,” she said. “It is just a bad morning, and you get another one tomorrow.”",
    ),
    list("The recital at a glance", [
      "90 minutes, played from memory",
      "Bach, Chopin and her own arrangement of an Indonesian piece",
      "Scholarship: two years of postgraduate study",
      "Practice: six hours a day on the music society's upright piano",
    ]),
    p(
      "Kirana will give one last recital on campus before she leaves, in the main hall in December. Entry is free. The music society is raising money to fix the sticky key, although Kirana has asked them to leave it as it is. “That key taught me more than any teacher,” she said. “The next student should learn to play around it too.”",
    ),
  ),

  // Unpublished: drafts are half written, pending ones complete, the
  // rejected one lacks what its review note asks for (vote counts, a source).
  19: html(
    p(
      "The dean of the faculty answered forty questions in ninety minutes at Thursday's open forum in the main lecture theatre. About two hundred students came, and the questions ranged from exam timetables to broken air conditioning.",
    ),
    p(
      "On the exam timetable, the dean said the faculty would review Saturday exams for next semester and promised a decision before registration opens. “We will publish the full answers online,” she said.",
    ),
    p(
      "The loudest applause came for a question about the air conditioning in the old lecture block, which has been broken since the start of the semester. The dean said the repairs were approved last week and would be done over the break. “I have sat in those rooms in the afternoon,” she said. “I would not ask anyone to study in them in that heat.”",
    ),
    todo("Still to write: the answers on housing and the new lab fees. Checking the quotes against the recording first."),
    list("Answers so far", [
      "Saturday exams: under review, decision before registration",
      "Reading room: the late opening continues next semester",
      "Air conditioning in the old lecture block: repairs over the break",
      "Housing: to add",
    ]),
    todo("Still to write: closing paragraph, and a quote from a student who asked a question."),
  ),
  20: html(
    p(
      "Sports day returns next Saturday, with heats across three courts in the morning and finals on the main field in the afternoon.",
    ),
    p(
      "Teams from all seven faculties will compete in football, basketball, badminton, volleyball and a relay race that closes the day. “Bring water and a hat,” said Fikri Ananda, chair of the student sports committee. “Last year we ran out of shade by eleven.”",
    ),
    pull("Bring water and a hat."),
    list("Where and when", [
      "8 a.m. to 12 p.m.: heats on courts A, B and C behind the sports hall",
      "12 p.m. to 2 p.m.: lunch break, food stalls by the main field",
      "2 p.m.: finals on the main field",
      "5 p.m.: relay race and medal ceremony",
    ]),
    p(
      "The best place to watch the finals is the grass bank on the east side of the main field, which has shade after three. For the heats, the stand at court B looks over two matches at once. Spectators are asked to keep the running track clear during the relay. Seats in the sports hall gallery are first come, first served, and the doors open at half past seven.",
    ),
    p(
      "Badminton is expected to draw the biggest crowds, as the faculty of economics defends last year's title. Volunteers will run a first aid tent next to the sports hall and a water station at every court. “We have more volunteers than ever, so the matches should start on time for once,” Fikri said.",
    ),
    p(
      "Teams can still register until Wednesday at the sports committee desk in the student centre. Each team needs a captain, at least one substitute and a name short enough for the scoreboard. Results will be posted on the noticeboard by the canteen on Monday. Photos from the day will be shared on the student centre screens the week after, together with the full table of results.",
    ),
  ),
  21: html(
    p(
      "Here is an unpopular opinion: the seven o'clock lecture is the best lecture of the week. I know. Half of my friends groan when they see one on their timetable, and the other half simply do not go. But after a semester of early starts, I have become a quiet fan, and I think more of us would be if we gave it a fair chance.",
    ),
    p(
      "Start with the room. At seven, nobody is half asleep after lunch, nobody is checking messages about the evening, and the lecturer has not yet given the same talk three times that day. The people who come want to be there. Questions get asked, and answered, because there are fewer of us and the room is quiet enough to hear them.",
    ),
    p(
      "Then there is the campus itself. Before eight the canteen queue is three people long, the library has free seats by the window and the paths between buildings are empty. It feels like a different place. By the time everyone else arrives, I have had breakfast, attended a lecture and read the notes once.",
    ),
    pull("The campus is yours before eight."),
    p(
      "The biggest gift is the afternoon. An early lecture means the day's teaching is often done by eleven. That leaves a whole afternoon for a part-time job, a club, a long library session or simply rest. My friends with ten o'clock and three o'clock lectures spend the hours in between waiting around. I spend mine doing things.",
    ),
    p(
      "My own routine is not heroic. I go to bed by ten on the nights before an early lecture, lay out my clothes, and buy a coffee on the way in from the one cart that is open at half past six. The first week was hard. By the third, I was waking up before the alarm, and my notes from early lectures are the best I have.",
    ),
    p(
      "Lecturers notice the difference too. Dr. Anton Wiryawan has taught the seven o'clock ecology class for years and says it is his favourite slot. “The students who come at seven have chosen to be there,” he told me. “We start on time, we finish on time, and the discussion is better than anything I get after lunch.”",
    ),
    p(
      "I asked other early risers what they get out of it, and most gave the answers I would: fewer distractions, more focus and a free afternoon. Lia Anggraini, a second-year nursing student, put it most simply. “By the time my phone wakes up, I am already done,” she said. Her classmate Doni Kurnia added a practical reason: “The lecturer is fresh, we are fresh, and nobody is late, because the traffic is still asleep.”",
    ),
    p(
      "There are real costs, and I do not want to pretend otherwise. Students who commute from far away have to leave home before six, and the first buses are crowded. Students who work late shifts cannot be in a lecture hall at seven. For them, an early slot is not a fresh start but an extra burden, and a timetable should not force it on them.",
    ),
    list("What I'm proposing", [
      "Keep a few early lectures, but offer them as one of two sittings, so nobody is forced into them",
      "Record early lectures for students who commute or work late",
      "Ask the canteen to open its coffee counter at 6.30 a.m.",
      "Add an early bus from the city terminal on lecture days",
    ]),
    p(
      "Early lectures are not for everyone, and they should never be the only option. But they are not the punishment we treat them as. Try one next semester, if your timetable allows it. The campus is quiet, the coffee is hot and the afternoon is yours.",
    ),
  ),
  22: html(
    p(
      "Organisers described them as the busiest club elections in years. Voting took place over three days in the student centre, with ballot boxes for each club set up in the main lobby.",
    ),
    p(
      "Turnout was the highest in five years, and several races were close. The hiking club's election went to a recount after the first count left the two candidates almost level. “Every vote was counted twice,” said one member of the election committee.",
    ),
    pull("Every vote was counted twice."),
    p(
      "Many of the new leaders ran on promises to make their clubs more open to first-year students. Dinda Kartika, the new president of the hiking club, wants a beginners' trip every month. “Half our members have never climbed anything,” she said. “I want them to feel they belong from the first week.”",
    ),
    p(
      "Campaign week was louder than usual. Candidates covered the student centre with posters, the debate club hosted an evening where club candidates answered questions from the floor, and the photography club's candidates handed out prints instead of flyers. Many first-year students voted for the first time. “I joined three clubs in my first month, so I had three ballots to fill in,” said Mega Puspita, a first-year psychology student. “It felt like a real election, with queues and everything.”",
    ),
    p(
      "In the debate club, the new president promised more training sessions before competitions, and the photography club's new chair said the club would keep its film camera collection on display for longer. Several clubs also elected treasurers for the first time, after the student council asked every club to name someone responsible for its budget.",
    ),
    list("Some of the new leaders", [
      "Hiking club: Dinda Kartika, president",
      "Debate club: a new president and a new training coordinator",
      "Photography club: a new chair",
      "Writing club: Salsa Anindya re-elected as coordinator",
    ]),
    p(
      "Not everyone was happy with the process. Some candidates said the ballot boxes closed too early on the last day, and one club is considering asking for a new vote. The student council said it would look into the complaints. Fajar Nugroho, the council president, said the rules for next year's elections would be written down earlier. “Every club ran its vote a little differently this time,” he said. “Next year there will be one set of rules, published before campaign week.”",
    ),
    p(
      "The new leaders take over at the start of next month. Most clubs will hold a welcome meeting in the first week, and the student council will run a short training session on budgets and room bookings for all new presidents and treasurers.",
    ),
  ),
  23: html(
    p(
      "The scholarships, awarded by the university for top grades and contributions to campus life, cover tuition for two semesters.",
    ),
    p("“Hard work, finally on paper,” said one of the recipients when the letters were handed out on Monday."),
    p(
      "The scholarships are awarded each semester to students with the highest grades in their faculty who also take part in campus life, from clubs and volunteering to the student council. This year the selection panel also looked at students who work part-time alongside their studies, a change the student council asked for last year.",
    ),
    todo("Waiting for the full list of recipients from the scholarship office before writing this part."),
    list("Recipients", ["Faculty of Engineering: to add", "Faculty of Economics: to add", "Faculty of Arts: to add"]),
    todo("Still to write: how to apply for next semester, and a quote from the scholarship office."),
  ),
};
