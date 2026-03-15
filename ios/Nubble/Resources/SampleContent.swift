import Foundation

enum SampleContent {
    static let paradoxOfChoice = ContentDocument(
        title: "The Paradox of Choice",
        author: "Adapted from Barry Schwartz",
        sections: [
            ContentSection(
                id: "s1",
                title: "More Is Less",
                summary: "More options lead to worse decisions and less satisfaction.",
                condensed: "Modern consumers face an explosion of choices \u{2014} from 285 varieties of cookies to 175 salad dressings. Counterintuitively, this abundance doesn\u{2019}t liberate us. It paralyzes us, leading to decision fatigue, regret, and ultimately less happiness with whatever we choose.",
                standard: """
                Walk into any modern supermarket and you\u{2019}ll face an overwhelming wall of options. There are 285 varieties of cookies, 175 salad dressings, and 275 types of cereal on a typical store shelf. The assumption has always been simple: more choice equals more freedom, and more freedom equals greater well-being.

                But research tells a different story. When Sheena Iyengar set up a jam-tasting booth at a gourmet store, she found that while a display of 24 jams attracted more attention, shoppers were 10 times more likely to purchase when shown just 6 options. The abundance of choice didn\u{2019}t empower \u{2014} it paralyzed.
                """,
                expanded: """
                Walk into any modern supermarket and you\u{2019}ll face an overwhelming wall of options. There are 285 varieties of cookies, 175 salad dressings, and 275 types of cereal on a typical store shelf. The assumption has always been simple: more choice equals more freedom, and more freedom equals greater well-being. This belief is deeply embedded in Western culture and capitalist economics.

                But research tells a different story. In a now-famous study at Draeger\u{2019}s supermarket in Menlo Park, California, psychologist Sheena Iyengar set up a jam-tasting booth. When 24 varieties were displayed, 60% of customers stopped to taste. When only 6 were shown, just 40% stopped. However, the conversion rates told the real story: 30% of those who sampled from the small selection purchased jam, compared to just 3% from the large display.

                The shoppers faced with 24 jams were 10 times less likely to buy. The abundance of choice didn\u{2019}t empower \u{2014} it paralyzed. And this pattern repeats across domains: retirement plans, college choices, medical treatments. The more options we have, the harder it is to choose, and the less satisfied we are with our decisions.

                This phenomenon has profound implications for product design, user experience, and personal well-being. Every additional option carries a cognitive cost that designers and decision-makers routinely underestimate.
                """
            ),
            ContentSection(
                id: "s2",
                title: "Maximizers vs. Satisficers",
                summary: "Maximizers seek the best; satisficers seek good enough. Satisficers are happier.",
                condensed: "Herbert Simon identified two decision-making strategies. Maximizers exhaustively compare options seeking the absolute best choice. Satisficers set a threshold of acceptability and stop when they find something that meets it. Research consistently shows satisficers are happier, less anxious, and more decisive \u{2014} even though maximizers often achieve objectively better outcomes.",
                standard: """
                Nobel laureate Herbert Simon identified two fundamental approaches to decision-making. "Maximizers" are people who always seek the absolute best option. They research exhaustively, compare endlessly, and often continue searching even after finding something good. "Satisficers" set a threshold of what\u{2019}s acceptable and stop searching once they find something that meets it.

                You might assume maximizers end up better off \u{2014} after all, they put in more effort. But the data reveals something surprising. While maximizers sometimes do achieve marginally better objective outcomes (a higher salary, a slightly better product), they pay an enormous psychological price. Maximizers report significantly more regret, anxiety, and dissatisfaction with their choices. The satisficer who buys a "good enough" sweater walks away content. The maximizer who buys the "best" sweater keeps wondering about the ones they didn\u{2019}t try.
                """,
                expanded: """
                Nobel laureate Herbert Simon identified two fundamental approaches to decision-making that have profound implications for how we live. "Maximizers" are people who always seek the absolute best option. They research exhaustively, compare endlessly, and often continue searching even after finding something good \u{2014} because what if something better is out there? "Satisficers" set a threshold of what\u{2019}s acceptable and stop searching once they find something that meets it.

                You might assume maximizers end up better off \u{2014} after all, they put in more effort and refuse to settle. But the data reveals something counterintuitive. In a study of college seniors seeking jobs, maximizers secured positions with 20% higher starting salaries than satisficers. Yet on every psychological measure \u{2014} happiness, satisfaction, optimism, self-esteem \u{2014} the maximizers scored worse. They were more depressed, more stressed, and more disappointed with their outcomes.

                The satisficer who buys a "good enough" sweater walks away content. The maximizer who buys the "best" sweater keeps wondering about the ones they didn\u{2019}t try on. In a world of infinite options, the maximizer\u{2019}s quest becomes Sisyphean \u{2014} there\u{2019}s always another review to read, another store to check, another comparison to make.

                Simon\u{2019}s insight suggests that in many decisions, the rational strategy isn\u{2019}t to optimize but to satisfice. The time, energy, and emotional toll of exhaustive comparison often exceeds the marginal benefit of a slightly better choice. This is especially true for reversible decisions, where the stakes of choosing "wrong" are low.
                """
            ),
            ContentSection(
                id: "s3",
                title: "Opportunity Cost",
                summary: "Choosing one option means losing all others, creating invisible costs that drain satisfaction.",
                condensed: "Every choice carries an invisible price: the value of options you didn\u{2019}t pick. As the number of alternatives grows, so does the psychological weight of what you\u{2019}ve given up. This \"opportunity cost\" doesn\u{2019}t just affect economics \u{2014} it fundamentally colors our emotional experience of the choices we make, leaving a residue of regret that taints even objectively good decisions.",
                standard: """
                The concept of opportunity cost \u{2014} what you give up when you choose one option over another \u{2014} is fundamental to economics. But its psychological impact is often underestimated. When you choose a restaurant for dinner, you\u{2019}re not just choosing that restaurant; you\u{2019}re also choosing not to eat at every other restaurant in the city.

                With fewer options, opportunity costs are manageable. If there are only two restaurants in town, choosing one means missing out on one alternative. But in a city with 500 restaurants, the shadow of unchosen options looms large. The Thai food you\u{2019}re eating might be excellent, but you can\u{2019}t help wondering about the Italian place, the new ramen shop, or the highly-rated tapas bar.

                Research shows that the mere contemplation of opportunity costs reduces satisfaction with whatever we choose. And the effect is proportional to the number of alternatives: more options mean more imagined pleasures foregone, creating a persistent background hum of "what if" that erodes our enjoyment of what we actually have.
                """,
                expanded: """
                The concept of opportunity cost \u{2014} what you give up when you choose one option over another \u{2014} is fundamental to economics. But its psychological impact is far more corrosive than most people realize, and it scales with the number of available alternatives.

                When you choose a restaurant for dinner, you\u{2019}re not just choosing that restaurant; you\u{2019}re also choosing not to eat at every other restaurant in the city. With fewer options, opportunity costs are manageable. If there are only two restaurants in town, choosing one means missing out on one alternative. But in a city with 500 restaurants, the shadow of unchosen options looms extraordinarily large.

                The Thai food you\u{2019}re eating might be excellent, but you can\u{2019}t help wondering about the Italian place, the new ramen shop, or the highly-rated tapas bar your colleague mentioned. Each imagined alternative subtracts from your present experience.

                Daniel Kahneman and Amos Tversky\u{2019}s research on loss aversion compounds this effect. Losses are psychologically weighted roughly twice as heavily as equivalent gains. So the pleasures you imagine missing out on feel more significant than the pleasure of your actual choice. The net effect: every option you add to the consideration set makes the chosen option feel slightly worse.

                This has practical implications for design. When Netflix shows you 10,000 movies, every minute spent watching one is a minute not spent watching the others. Paradoxically, a curated list of 50 films would likely produce more viewing satisfaction \u{2014} not because the content is better, but because the psychological tax of opportunity cost is dramatically reduced.
                """
            ),
            ContentSection(
                id: "s4",
                title: "The Escalation of Expectations",
                summary: "More choices raise our expectations, making satisfaction nearly impossible.",
                condensed: "When options are limited, we expect less and are pleasantly surprised when things go well. With abundant choices, we expect perfection \u{2014} after all, with so many options, surely one must be exactly right. This expectation inflation means that even objectively superior outcomes feel disappointing because they fall short of the impossibly high bar we\u{2019}ve set.",
                standard: """
                There\u{2019}s a simple psychological principle at work: the more options we have, the higher our expectations climb. If there\u{2019}s only one pair of jeans available, you expect them to be decent. If there are 50 styles, 15 washes, and 8 fits, you expect to find the perfect pair \u{2014} the ones that make you look and feel exactly the way you want.

                This expectation escalation has a cruel consequence. When the jeans you buy are merely good \u{2014} comfortable, well-fitting, reasonably flattering \u{2014} you feel let down. With 50 options, "good" feels like failure because "perfect" seemed achievable. The objective quality of the jeans hasn\u{2019}t changed, but the subjective experience has been poisoned by inflated expectations.

                Before the explosion of choices, "good enough" was genuinely good enough. People wore their decent jeans and didn\u{2019}t think twice about it. Now, the gap between what we expect and what we experience has widened into a chasm \u{2014} not because products have gotten worse, but because our expectations have raced ahead of reality.
                """,
                expanded: """
                There\u{2019}s a simple psychological principle at work: the more options we have, the higher our expectations climb. If there\u{2019}s only one pair of jeans available \u{2014} the kind your parents wore \u{2014} you expect them to be decent. If there are 50 styles, 15 washes, 8 fits, and 3 stretch levels, you expect to find the perfect pair. And perfection, by definition, is unattainable.

                This expectation escalation has a cruel consequence. When the jeans you buy are merely good \u{2014} comfortable, well-fitting, reasonably flattering \u{2014} you feel let down. With 50 options, "good" feels like failure because "perfect" seemed achievable. The objective quality of the jeans hasn\u{2019}t changed, but the subjective experience has been poisoned by inflated expectations.

                Psychologist Philip Brickman demonstrated a related effect in his hedonic treadmill research. Lottery winners and paraplegic accident victims, one year after their life-changing events, reported remarkably similar levels of daily happiness. Our expectations adapt to our circumstances \u{2014} and in a world of abundance, they adapt upward relentlessly.

                Before the explosion of choices, "good enough" was genuinely good enough. People wore their decent jeans and didn\u{2019}t agonize. Now, the gap between what we expect and what we experience has widened into a chasm \u{2014} not because products have gotten worse (they\u{2019}ve gotten dramatically better), but because our expectations have raced ahead of reality.

                This creates a paradox: the progress that gives us better options simultaneously guarantees that those options will feel less satisfying. The very abundance that should make us grateful instead makes us perpetually disappointed.
                """
            ),
            ContentSection(
                id: "s5",
                title: "Self-Blame and Regret",
                summary: "With many choices, we blame ourselves for imperfect outcomes, increasing regret.",
                condensed: "When you have no choice, a bad outcome is the world\u{2019}s fault. When you have many choices, a bad outcome is yours. The abundance of options shifts responsibility entirely onto the chooser, creating a toxic brew of self-blame and regret. Even objectively good outcomes feel tainted: \"I should have chosen better.\" This internalized blame is a significant contributor to rising rates of anxiety and depression.",
                standard: """
                Perhaps the most psychologically damaging effect of excessive choice is what it does to our sense of personal responsibility. When there\u{2019}s only one option and it disappoints, you can blame the world \u{2014} there was nothing else available. But when you\u{2019}ve chosen from 50 options and the result is mediocre, there\u{2019}s only one person to blame: yourself.

                This shift in attribution is profound. "With so many options, I should have been able to find the right one" becomes the internal monologue. The failure isn\u{2019}t in the options \u{2014} it\u{2019}s in you. You didn\u{2019}t research enough, you didn\u{2019}t compare carefully enough, you weren\u{2019}t discerning enough.

                Regret, which psychologists identify as one of the most powerful negative emotions, feeds on this self-blame. Post-decision regret is amplified by the number of alternatives: the more paths not taken, the more chances to second-guess yourself. And anticipated regret \u{2014} the fear of future regret \u{2014} makes decisions even more agonizing before they\u{2019}re made, creating a paralyzing loop of anxiety.
                """,
                expanded: """
                Perhaps the most psychologically damaging effect of excessive choice is what it does to our sense of personal responsibility. When there\u{2019}s only one option and it disappoints, you can blame the world \u{2014} there was nothing else available. But when you\u{2019}ve chosen from 50 options and the result is mediocre, there\u{2019}s only one person to blame: yourself.

                This shift in attribution is profound and insidious. "With so many options, I should have been able to find the right one" becomes the internal monologue. The failure isn\u{2019}t in the options \u{2014} it\u{2019}s in you. You didn\u{2019}t research enough, you didn\u{2019}t compare carefully enough, you weren\u{2019}t discerning enough.

                Regret, which psychologists identify as one of the most powerful negative emotions, feeds on this self-blame. Research by Thomas Gilovich and Victoria Medvec shows that post-decision regret is amplified by the number of alternatives. The more paths not taken, the more chances to second-guess yourself. And anticipated regret \u{2014} the fear of future regret \u{2014} makes decisions even more agonizing before they\u{2019}re made.

                This creates a paralyzing cycle: the fear of making a wrong choice delays the decision, the delay adds time pressure, the pressure leads to a hasty choice, and the hasty choice confirms the fear that you don\u{2019}t choose well. Meanwhile, the unchosen options haunt you \u{2014} what Gilovich calls the "haunting alternative."

                The connection to clinical depression is well-documented. Martin Seligman\u{2019}s work on "learned helplessness" shows that when people believe they\u{2019}re responsible for bad outcomes they can\u{2019}t control, depression follows. In a world of infinite choice, every disappointment feels self-inflicted. The paradox is complete: the freedom to choose has become, for many, a burden that corrodes well-being.
                """
            ),
            ContentSection(
                id: "s6",
                title: "What Can Be Done",
                summary: "Deliberately constrain choices, embrace \u{2018}good enough,\u{2019} and lower expectations.",
                condensed: "The antidote to choice overload is intentional constraint. Consciously limit your options before deciding. Adopt a satisficing mindset \u{2014} \u{2018}good enough\u{2019} truly is good enough for most decisions. Reserve maximizing for choices that genuinely matter. Make decisions irreversible when possible. Practice gratitude for what you have rather than ruminating on what you don\u{2019}t. These aren\u{2019}t compromises \u{2014} they\u{2019}re strategies for greater happiness.",
                standard: """
                If more choice makes us miserable, the solution isn\u{2019}t to eliminate all options \u{2014} it\u{2019}s to develop better strategies for navigating abundance. Several evidence-based approaches can help.

                First, choose when to choose. Not every decision deserves the same investment. Reserve careful deliberation for choices that truly matter \u{2014} your career, your relationships, your health. For everything else, adopt a satisficing approach. The marginal benefit of finding the "best" toothpaste is negligible.

                Second, make your decisions irreversible when possible. Research shows that people who can\u{2019}t return their choices are more satisfied than those who can. Commitment focuses the mind on the virtues of what we have rather than the possibilities of what we don\u{2019}t.

                Third, practice gratitude. Actively appreciating what we\u{2019}ve chosen counteracts the corrosive effect of imagined alternatives. The Thai restaurant you\u{2019}re at? It\u{2019}s delicious. Let that be enough.

                Finally, lower your expectations. This isn\u{2019}t pessimism \u{2014} it\u{2019}s realism. When you expect the good rather than the perfect, you create space for pleasant surprises rather than constant disappointment.
                """,
                expanded: """
                If more choice makes us miserable, the solution isn\u{2019}t to eliminate all options \u{2014} it\u{2019}s to develop better strategies for navigating abundance. Several evidence-based approaches can help reclaim satisfaction from the jaws of excess.

                First, choose when to choose. Not every decision deserves the same cognitive investment. Reserve careful deliberation for choices that truly matter \u{2014} your career, your relationships, your health, your values. For everything else \u{2014} toothpaste, socks, lunch spots \u{2014} adopt a satisficing approach. The marginal benefit of finding the "best" toothpaste is negligible compared to the cognitive cost of researching it.

                Second, embrace voluntary constraints. Limit yourself to considering 3-5 options maximum for most decisions. Unsubscribe from deal-aggregation emails. Stop reading reviews after you\u{2019}ve already made a purchase. Curate your inputs to reduce the noise of alternatives.

                Third, make your decisions irreversible when possible. Counterintuitively, research by Daniel Gilbert shows that people who can\u{2019}t return their choices are significantly more satisfied than those who can. The returnable painting is never fully appreciated because it was never fully committed to. Non-returnable decisions trigger a psychological immune system that finds genuine value in the chosen option.

                Fourth, practice gratitude deliberately. Actively appreciating what we\u{2019}ve chosen counteracts the corrosive effect of imagined alternatives. Keep a decision journal. Note what\u{2019}s good about your choices rather than what\u{2019}s missing.

                Fifth, lower your expectations. This isn\u{2019}t pessimism \u{2014} it\u{2019}s realism. When you expect the good rather than the perfect, you create space for pleasant surprises rather than constant disappointment. The secret to satisfaction isn\u{2019}t getting what you want \u{2014} it\u{2019}s wanting what you get.
                """
            ),
        ]
    )
}
