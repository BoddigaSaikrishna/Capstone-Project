import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_cdgs_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Theme Colors - Soft Indigo / Purple & Light Modern Corporate (Matching User's Screenshots)
    BG_LIGHT = RGBColor(248, 250, 252)       # #F8FAFC
    CARD_BG = RGBColor(255, 255, 255)        # #FFFFFF
    CARD_BORDER = RGBColor(226, 232, 240)    # #E2E8F0
    TEXT_DARK = RGBColor(30, 41, 59)         # #1E293B
    TEXT_MUTED = RGBColor(100, 116, 139)     # #64748B
    PRIMARY_PURPLE = RGBColor(79, 70, 229)   # #4F46E5 (Indigo 600)
    ACCENT_PURPLE = RGBColor(99, 102, 241)   # #6366F1 (Indigo 500)
    DARK_PURPLE = RGBColor(49, 46, 129)      # #312E81 (Indigo 900)
    BG_PURPLE_SOFT = RGBColor(238, 242, 255) # #EEF2FF (Indigo 50)
    TABLE_HEADER_BG = RGBColor(79, 70, 229)

    def set_slide_bg(slide, color=BG_LIGHT):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title_text, category="SOFTWARE MODELLING AND DEVOPS"):
        # Category badge
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
        tf_cat = cat_box.text_frame
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = PRIMARY_PURPLE
        p_cat.font.name = "Arial"

        # Main slide title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.7), Inches(0.6))
        tf_title = title_box.text_frame
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_DARK
        p_title.font.name = "Arial"

        # Underline
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(0.03))
        line.fill.solid()
        line.fill.fore_color.rgb = ACCENT_PURPLE
        line.line.fill.background()

    def add_card(slide, left, top, width, height, bg_rgb=CARD_BG, border_rgb=CARD_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_rgb
        shape.line.color.rgb = border_rgb
        shape.line.width = Pt(1)
        return shape

    # ==========================================
    # SLIDE 1: Title & Team Information (Pic 1)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide1, BG_PURPLE_SOFT)

    # Main Card container
    add_card(slide1, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9), CARD_BG, PRIMARY_PURPLE)

    # Title
    tb = slide1.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.9), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Continuous Documentation Generation System"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = DARK_PURPLE

    # Subtitle
    sub_tb = slide1.shapes.add_textbox(Inches(1.2), Inches(2.2), Inches(10.9), Inches(0.5))
    tf_sub = sub_tb.text_frame
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Software Modelling and DevOps"
    p_sub.font.size = Pt(18)
    p_sub.font.bold = True
    p_sub.font.color.rgb = PRIMARY_PURPLE

    # Underline bar
    bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(2.8), Inches(2.5), Inches(0.04))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PRIMARY_PURPLE
    bar.line.fill.background()

    # Left Column: Project Metadata
    meta_card = add_card(slide1, Inches(1.2), Inches(3.1), Inches(4.8), Inches(3.2), BG_PURPLE_SOFT, CARD_BORDER)
    m_tb = slide1.shapes.add_textbox(Inches(1.4), Inches(3.2), Inches(4.4), Inches(3.0))
    m_tf = m_tb.text_frame
    m_tf.word_wrap = True

    meta_rows = [
        ("👤 Project Lead:", "E.N.V.B. Sai Eswar"),
        ("👤 Guide:", "Ms. Badipati Sivaganga"),
        ("🆔 Employee ID:", "8979"),
        ("📅 Report Date:", "13 August 2026")
    ]

    for i, (k, v) in enumerate(meta_rows):
        p_k = m_tf.paragraphs[0] if i==0 else m_tf.add_paragraph()
        p_k.text = f"{k}  {v}"
        p_k.font.size = Pt(13)
        p_k.font.bold = True
        p_k.font.color.rgb = TEXT_DARK
        p_k.space_before = Pt(10) if i>0 else Pt(0)

    # Right Column: Team Members
    team_card = add_card(slide1, Inches(6.2), Inches(3.1), Inches(5.9), Inches(3.2), BG_PURPLE_SOFT, CARD_BORDER)
    t_tb = slide1.shapes.add_textbox(Inches(6.4), Inches(3.2), Inches(5.5), Inches(3.0))
    t_tf = t_tb.text_frame
    t_tf.word_wrap = True

    p = t_tf.paragraphs[0]
    p.text = "Team Members & Responsibilities"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    members = [
        ("S. Katyayani", "Documentation & Worker Service"),
        ("E.N.V.B. Sai Eswar", "Pipeline Execution & Project Lead"),
        ("K. Lokesh", "Frontend Development & Research Paper Publishing"),
        ("Hari Hara Nadh", "Backend & GitHub Authentication")
    ]

    for name, role in members:
        p_m = t_tf.add_paragraph()
        p_m.text = f"• {name}  —  {role}"
        p_m.font.size = Pt(12)
        p_m.font.bold = True
        p_m.font.color.rgb = TEXT_DARK
        p_m.space_before = Pt(8)

    # ==========================================
    # SLIDE 2: Introduction (Pic 2)
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide2)
    add_header(slide2, "Introduction")

    # Banner quote text
    b_tb = slide2.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.5))
    p = b_tb.text_frame.paragraphs[0]
    p.text = "Software documentation is difficult to keep current because projects change continuously."
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_DARK

    # Left: The Challenge Card
    c_card = add_card(slide2, Inches(0.8), Inches(2.2), Inches(5.6), Inches(2.1))
    c_tb = slide2.shapes.add_textbox(Inches(1.0), Inches(2.4), Inches(5.2), Inches(1.7))
    c_tf = c_tb.text_frame
    c_tf.word_wrap = True
    p = c_tf.paragraphs[0]
    p.text = "The Challenge"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    p_d = c_tf.add_paragraph()
    p_d.text = "Manual documentation is time-consuming and quickly becomes outdated as software evolves."
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = TEXT_MUTED
    p_d.space_before = Pt(8)

    # Left: The Solution Card
    s_card = add_card(slide2, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.1))
    s_tb = slide2.shapes.add_textbox(Inches(1.0), Inches(4.7), Inches(5.2), Inches(1.7))
    s_tf = s_tb.text_frame
    s_tf.word_wrap = True
    p = s_tf.paragraphs[0]
    p.text = "The Solution"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    p_d = s_tf.add_paragraph()
    p_d.text = "Automate documentation updates by seamlessly integrating GitHub, background automation, and AI processing."
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = TEXT_MUTED
    p_d.space_before = Pt(8)

    # Right: Workflow Visual Graphic Box
    flow_card = add_card(slide2, Inches(6.8), Inches(2.2), Inches(5.733), Inches(4.4), BG_PURPLE_SOFT, PRIMARY_PURPLE)
    fl_tb = slide2.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.133), Inches(3.6))
    fl_tf = fl_tb.text_frame
    fl_tf.word_wrap = True

    p = fl_tf.paragraphs[0]
    p.text = "CONTINUOUS CHANGE PIPELINE"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    steps = ["1. Source Code Push", "2. Webhook Event Trigger", "3. Automated Worker Processing", "4. Auto-Updated Documentation"]
    for s in steps:
        p_step = fl_tf.add_paragraph()
        p_step.text = f"⬇   {s}"
        p_step.alignment = PP_ALIGN.CENTER
        p_step.font.size = Pt(14)
        p_step.font.bold = True
        p_step.font.color.rgb = TEXT_DARK
        p_step.space_before = Pt(14)

    # ==========================================
    # SLIDE 3: Problem Statement (Pic 3)
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide3)
    add_header(slide3, "Problem Statement")

    prob_cards = [
        ("Effort", "Manual documentation requires significant developer effort."),
        ("Drift", "Documentation may become inconsistent with source code."),
        ("Forgetfulness", "Developers may forget to update documentation after code changes."),
        ("Scale", "Large projects are difficult to document manually."),
        ("API Maintenance", "API documentation requires continuous maintenance."),
        ("Release Overhead", "Release summaries and change descriptions require additional effort.")
    ]

    p_w = Inches(3.65)
    p_h = Inches(1.8)

    for i, (title, desc) in enumerate(prob_cards):
        row = i // 2
        col = i % 2
        cx = Inches(0.8) + col * Inches(3.9)
        cy = Inches(1.6) + row * Inches(1.9)

        add_card(slide3, cx, cy, p_w, p_h)
        tb = slide3.shapes.add_textbox(cx + Inches(0.15), cy + Inches(0.15), p_w - Inches(0.3), p_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(6)

    # Right side Quote callout
    q_card = add_card(slide3, Inches(8.8), Inches(1.6), Inches(3.733), Inches(5.4), BG_PURPLE_SOFT, ACCENT_PURPLE)
    q_tb = slide3.shapes.add_textbox(Inches(9.0), Inches(2.2), Inches(3.333), Inches(4.2))
    q_tf = q_tb.text_frame
    q_tf.word_wrap = True

    p = q_tf.paragraphs[0]
    p.text = "CORE QUESTION"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    p_q = q_tf.add_paragraph()
    p_q.text = "“How can documentation stay synchronized with changing source code?”"
    p_q.font.size = Pt(18)
    p_q.font.bold = True
    p_q.font.italic = True
    p_q.font.color.rgb = DARK_PURPLE
    p_q.space_before = Pt(24)

    # ==========================================
    # SLIDE 4: Objectives (Pic 4)
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide4)
    add_header(slide4, "System Objectives")

    objs = [
        ("🤖 Automate Documentation", "Automate technical documentation generation from code changes."),
        ("🔄 Stay Synchronized", "Keep documentation synchronized with source-code changes."),
        ("📊 Project Dashboard", "Provide a centralized project dashboard for visibility and control."),
        ("🐙 GitHub Integration", "Support GitHub repository integration."),
        ("⚡ Async Processing", "Implement asynchronous processing using BullMQ and Redis."),
        ("🧠 AI Summaries", "Provide AI-assisted summaries of changes."),
        ("🛡️ Secure Verification", "Maintain secure authentication and webhook verification."),
        ("📜 API Documentation", "Provide generated API documentation."),
        ("📋 Audit Trail", "Maintain execution history and audit information.")
    ]

    o_w = Inches(3.65)
    o_h = Inches(1.6)

    for i, (title, desc) in enumerate(objs):
        col = i // 3
        row = i % 3
        cx = Inches(0.8) + col * Inches(3.9)
        cy = Inches(1.6) + row * Inches(1.8)

        add_card(slide4, cx, cy, o_w, o_h)
        tb = slide4.shapes.add_textbox(cx + Inches(0.15), cy + Inches(0.15), o_w - Inches(0.3), o_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(4)

    # ==========================================
    # SLIDE 5: Proposed System (Pic 5)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide5)
    add_header(slide5, "Proposed System Pipeline")

    # Banner
    b_tb = slide5.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.4))
    p = b_tb.text_frame.paragraphs[0]
    p.text = "The CDGS pipeline converts repository changes into updated documentation automatically."
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEXT_DARK

    # Horizontal Flow Cards (4 Process Steps)
    steps_data = [
        ("1. Repository Change", "Developer pushes code updates or merges PR."),
        ("2. Webhook Event", "GitHub sends event payload to webhook endpoint."),
        ("3. Change Detection", "AST parser & Git diff extracts code modifications."),
        ("4. Docs Generation & AI", "DocGen engine & LLM produce updated docs & publish.")
    ]

    p_w = Inches(11.733)
    p_h = Inches(1.1)

    for i, (title, desc) in enumerate(steps_data):
        cy = Inches(2.1) + i * Inches(1.2)
        c_shape = add_card(slide5, Inches(0.8), cy, p_w, p_h, CARD_BG if i%2==0 else BG_PURPLE_SOFT, PRIMARY_PURPLE)

        tb = slide5.shapes.add_textbox(Inches(1.1), cy + Inches(0.15), p_w - Inches(0.6), p_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = TEXT_DARK
        p_d.space_before = Pt(2)

    # ==========================================
    # SLIDE 6: System Architecture (Requested)
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide6)
    add_header(slide6, "System Architecture")

    arch_cards = [
        ("CLIENT LAYER", "React / Next.js Dashboard", "Provides real-time pipeline monitoring, project controls, audit history, and generated documentation viewer."),
        ("API & WEBHOOK GATEWAY", "Node.js Express API Server", "Listens for GitHub Webhook payloads, handles OAuth authentication, and validates HMAC SHA256 signatures."),
        ("ASYNC TASK QUEUE", "BullMQ & Redis Message Broker", "Decouples webhook ingestion from doc processing; enqueues tasks and handles retry mechanisms."),
        ("WORKER & AI ENGINE", "Worker Nodes & LLM Summarizer", "Performs sparse Git clone, AST diff parsing, TypeDoc/JSDoc generation, and AI-assisted change summaries."),
        ("STORAGE & PUBLISHING", "PostgreSQL DB & Docs Publisher", "Persists execution history, logs, metadata, and publishes rendered Markdown/HTML docs to target repos/sites.")
    ]

    a_w = Inches(11.733)
    a_h = Inches(0.95)

    for i, (title, sub, desc) in enumerate(arch_cards):
        cy = Inches(1.6) + i * Inches(1.05)
        card = add_card(slide6, Inches(0.8), cy, a_w, a_h)

        tb = slide6.shapes.add_textbox(Inches(1.1), cy + Inches(0.1), a_w - Inches(0.6), a_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{title}: {sub}"
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK
        p_d.space_before = Pt(2)

    # ==========================================
    # SLIDE 7: Technology Stack (Requested)
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide7)
    add_header(slide7, "Technology Stack")

    tech_categories = [
        ("Frontend", "React.js, TypeScript, Tailwind CSS, Lucide Icons"),
        ("Backend API", "Node.js, Express.js / TypeScript"),
        ("Task Queue & Cache", "Redis, BullMQ (Asynchronous Background Queue)"),
        ("GitHub & Automation", "GitHub Webhook REST API, Octokit SDK"),
        ("Code Analysis & DocGen", "Babel AST Parser, TypeDoc, JSDoc, Markdown Renderers"),
        ("AI Summarization Engine", "LLM Integration (OpenAI API / Gemini API)"),
        ("Database & Storage", "PostgreSQL (Metadata & Audit Logs), Local Vault / S3"),
        ("DevOps & Containerization", "Docker, Docker Compose, Git, CI/CD Pipeline")
    ]

    t_w = Inches(5.7)
    t_h = Inches(1.2)

    for i, (cat, stack) in enumerate(tech_categories):
        col = i // 4
        row = i % 4
        cx = Inches(0.8) + col * Inches(6.033)
        cy = Inches(1.6) + row * Inches(1.35)

        add_card(slide7, cx, cy, t_w, t_h)
        tb = slide7.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.15), t_w - Inches(0.4), t_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_c = tf.paragraphs[0]
        p_c.text = cat
        p_c.font.size = Pt(13)
        p_c.font.bold = True
        p_c.font.color.rgb = PRIMARY_PURPLE

        p_s = tf.add_paragraph()
        p_s.text = stack
        p_s.font.size = Pt(12)
        p_s.font.color.rgb = TEXT_DARK
        p_s.space_before = Pt(4)

    # ==========================================
    # SLIDE 8: System Workflow (Requested)
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide8)
    add_header(slide8, "System Workflow & Pipeline Execution Flow")

    workflow_steps = [
        ("Step 1: Developer Push Event", "Developer pushes code or merges a PR into the GitHub repository."),
        ("Step 2: Webhook Trigger & Dispatch", "GitHub Webhook fires a POST request with encrypted HMAC SHA256 signature to the API gateway."),
        ("Step 3: Webhook Verification & Enqueueing", "Backend validates signature, constructs job payload, and pushes `DocGenJob` to BullMQ Redis Queue."),
        ("Step 4: Background Worker Processing", "Worker service dequeues job, clones repository diff, and parses modified source files via AST parser."),
        ("Step 5: AI Summarization & Doc Rendering", "Diff content is sent to AI LLM for context-aware summaries; DocGen engine compiles updated Markdown/HTML."),
        ("Step 6: Publishing & Audit Logging", "Updated documentation is published to GitHub Pages/Wiki; job audit metadata is persisted to PostgreSQL.")
    ]

    w_card_w = Inches(11.733)
    w_card_h = Inches(0.8)

    for i, (stitle, sdesc) in enumerate(workflow_steps):
        cy = Inches(1.5) + i * Inches(0.9)
        add_card(slide8, Inches(0.8), cy, w_card_w, w_card_h)

        tb = slide8.shapes.add_textbox(Inches(1.0), cy + Inches(0.08), w_card_w - Inches(0.4), w_card_h - Inches(0.16))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{stitle}:  {sdesc}"
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE if i%2==0 else DARK_PURPLE

    # ==========================================
    # SLIDE 9: Expected Outcomes (Requested)
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide9)
    add_header(slide9, "Expected Outcomes")

    outcomes = [
        ("⚡ Zero-Touch Automated Documentation", "Documentation is updated within seconds of code commit pushes without any developer manual effort."),
        ("🎯 Elimination of Documentation Drift", "Ensures 100% synchronization between active codebase logic and published API/technical references."),
        ("🚀 80% Reduction in Developer Effort", "Frees developer bandwidth by automating changelogs, release notes, and AST API documentation generation."),
        ("🛡️ High Reliability via Async Architecture", "BullMQ + Redis background processing guarantees job retries and prevents API timeout bottlenecks."),
        ("📊 Complete Visibility & Audit Trail", "Centralized React dashboard provides full execution history, pipeline logs, and repository health metrics.")
    ]

    for i, (title, desc) in enumerate(outcomes):
        cy = Inches(1.6) + i * Inches(1.05)
        add_card(slide9, Inches(0.8), cy, Inches(11.733), Inches(0.95), CARD_BG, ACCENT_PURPLE)

        tb = slide9.shapes.add_textbox(Inches(1.1), cy + Inches(0.1), Inches(11.133), Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK
        p_d.space_before = Pt(2)

    # ==========================================
    # SLIDE 10: Future Scope (Requested)
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide10)
    add_header(slide10, "Future Scope & Enhancements")

    futures = [
        ("🌐 Multi-VCS Platform Support", "Expand integrations beyond GitHub to support GitLab, Bitbucket, and Azure DevOps repositories."),
        ("🔤 Multi-Language AST Parsers", "Extend parser capabilities to natively support Python (Sphinx), Java (Javadoc), Go (Godoc), and Rust (Rustdoc)."),
        ("🧪 Interactive API Sandbox", "Embed Swagger UI and Postman-style interactive API request testers directly inside generated doc pages."),
        ("🔌 IDE Plugins (VS Code & JetBrains)", "Develop local IDE extensions allowing developers to preview AI-generated doc diffs before committing code."),
        ("🔒 Enterprise RBAC & Governance", "Implement Role-Based Access Control, SAML/SSO integration, and fine-grained team organization permissions.")
    ]

    for i, (title, desc) in enumerate(futures):
        cy = Inches(1.6) + i * Inches(1.05)
        add_card(slide10, Inches(0.8), cy, Inches(11.733), Inches(0.95))

        tb = slide10.shapes.add_textbox(Inches(1.1), cy + Inches(0.1), Inches(11.133), Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_PURPLE

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK
        p_d.space_before = Pt(2)

    # ==========================================
    # SLIDE 11: Conclusion (Requested)
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide11, BG_PURPLE_SOFT)
    add_header(slide11, "Conclusion")

    add_card(slide11, Inches(0.8), Inches(1.6), Inches(11.733), Inches(5.2), CARD_BG, PRIMARY_PURPLE)

    tb = slide11.shapes.add_textbox(Inches(1.2), Inches(2.0), Inches(10.933), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "SUMMARY OF ACHIEVEMENTS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    c_points = [
        ("Solves Chronic Documentation Drift", "The Continuous Documentation Generation System (CDGS) effectively bridges the gap between fast-paced source code evolution and static technical documentation."),
        ("Robust DevOps Integration", "By seamlessly combining GitHub Webhooks, asynchronous Redis + BullMQ job queues, and automated AST parsers, CDGS creates a zero-touch documentation pipeline."),
        ("AI-Powered Contextual Intelligence", "Integrating LLM summarization elevates standard code comments into comprehensive, human-readable release notes and change descriptions."),
        ("Scalable & Production-Ready", "Decoupled architecture guarantees high-throughput background execution without impacting developer workflow or primary API responsiveness.")
    ]

    for title, desc in c_points:
        p_t = tf.add_paragraph()
        p_t.text = "• " + title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_DARK
        p_t.space_before = Pt(12)

        p_d = tf.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(2)

    # ==========================================
    # SLIDE 12: Thank You / Q&A Slide
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide12, BG_PURPLE_SOFT)

    add_card(slide12, Inches(1.5), Inches(1.5), Inches(10.333), Inches(4.5), CARD_BG, PRIMARY_PURPLE)
    tb = slide12.shapes.add_textbox(Inches(1.8), Inches(2.2), Inches(9.733), Inches(3.1))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "Thank You!"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_PURPLE

    p_sub = tf.add_paragraph()
    p_sub.text = "Continuous Documentation Generation System"
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.font.size = Pt(18)
    p_sub.font.bold = True
    p_sub.font.color.rgb = DARK_PURPLE
    p_sub.space_before = Pt(10)

    p_qa = tf.add_paragraph()
    p_qa.text = "Questions & Answers / Discussion"
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.font.size = Pt(16)
    p_qa.font.bold = True
    p_qa.font.color.rgb = ACCENT_PURPLE
    p_qa.space_before = Pt(20)

    output_path = r"c:\Users\bsaik\Desktop\Capstone\pipeline-main\Continuous_Documentation_Generation_System.pptx"
    prs.save(output_path)
    print(f"CDGS Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    build_cdgs_presentation()
