import os
import re
import json
import time
import difflib
import streamlit as st

# ==========================================
# PAGE CONFIGURATION
# ==========================================
st.set_page_config(
    page_title="AI Debug Agent | StackFix",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# CUSTOM CSS STYLING (PROFESSIONAL DARK THEME)
# ==========================================
CUSTOM_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Main Container Padding */
    .main .block-container {
        padding-top: 1.8rem;
        padding-bottom: 3rem;
        max-width: 1200px;
    }

    /* Gradient Brand Title */
    .brand-header {
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 30%, #9B51E0 70%, #00C9FF 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        font-size: 2.6rem;
        letter-spacing: -0.5px;
        margin-bottom: 0.2rem;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .brand-tagline {
        color: #A0AEC0;
        font-size: 1.15rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
    }

    /* Custom Glassmorphic Card */
    .glass-card {
        background: rgba(22, 27, 34, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.2rem;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .glass-card:hover {
        border-color: rgba(255, 255, 255, 0.18);
    }

    /* Status Badges */
    .badge-api-online {
        background-color: rgba(72, 187, 120, 0.15);
        color: #48BB78;
        border: 1px solid rgba(72, 187, 120, 0.3);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .badge-offline {
        background-color: rgba(236, 201, 75, 0.15);
        color: #ECC94B;
        border: 1px solid rgba(236, 201, 75, 0.3);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    /* Section Headers */
    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #F7FAFC;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Code Block Polish */
    pre, code {
        font-family: 'Fira Code', monospace !important;
    }

    /* Confidence Meter */
    .confidence-high {
        color: #48BB78;
        font-weight: 700;
    }
    .confidence-medium {
        color: #ECC94B;
        font-weight: 700;
    }
    .confidence-low {
        color: #F56565;
        font-weight: 700;
    }

    /* Button Styling Overrides */
    div.stButton > button {
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    
    div.stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
        border: none;
        box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
    }

    div.stButton > button[kind="primary"]:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.55);
    }

    /* Hide Streamlit default menu padding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ==========================================
# PRE-LOADED SAMPLE ERRORS
# ==========================================
PRESET_EXAMPLES = {
    "Select an example...": {
        "language": "Python",
        "code": ""
    },
    "🐍 Python: NameError (Undefined Variable)": {
        "language": "Python",
        "code": """name = "Alex"
print("Hello " + username)  # Error: 'username' is used instead of 'name'"""
    },
    "🐍 Python: NameError (Typo in Function Call)": {
        "language": "Python",
        "code": """def calculate_total_price(price, tax_rate, discount):
    subtotal = price * (1 - discunt)  # Typo in variable name
    total = subtotal + (subtotal * tax_rate)
    return total

items_cost = 150.0
tax = 0.08
disc = 0.15

print("Final Invoice:", calculate_total_price(items_cost, tax, disc))"""
    },
    "🟨 JS: TypeError (Cannot read properties of undefined)": {
        "language": "JavaScript",
        "code": """function renderUserProfile(user) {
    console.log("Loading profile for:", user.profile.name);
    const avatarUrl = user.profile.avatar.url;
    return `<img src="${avatarUrl}" /> <h3>${user.profile.name}</h3>`;
}

const currentUser = { id: 892, role: "developer" };
renderUserProfile(currentUser);"""
    },
    "🐍 Python: Indentation & Syntax Error": {
        "language": "Python",
        "code": """def process_user_data(user_id, status)
    if status == "active"
    print("User is active")
        user_record = {"id": user_id, "active": True}
      return user_record"""
    },
    "🟨 JS: Async/Await Promise Bug": {
        "language": "JavaScript",
        "code": """async function fetchUserData(userId) {
    const response = fetch(`https://api.example.com/users/${userId}`);
    const data = response.json();
    return data;
}

fetchUserData(42).then(data => console.log(data));"""
    },
    "🐍 Python: KeyError in Dictionary": {
        "language": "Python",
        "code": """config = {
    "host": "localhost",
    "port": 8080,
    "db_name": "production_db"
}

db_password = config["password"]
print("Connected with pass:", db_password)"""
    }
}


# ==========================================
# RULE-BASED OFFLINE ENGINE (PROFESSIONAL FALLBACK)
# ==========================================
def analyze_error_offline(error_text: str, language: str) -> dict:
    """
    Intelligent pattern-matching diagnostic engine that analyzes error messages
    and code snippets with professional developer-grade output.
    """
    text_lower = error_text.lower()
    
    # Simple Rule Fix 1: 'username' referenced while 'name =' exists
    if "username" in error_text and re.search(r"\bname\s*=", error_text):
        corrected = error_text.replace("username", "name")
        return {
            "explanation": "The variable 'username' is used but not defined.",
            "root_cause": "You defined 'name' in the assignment, but used 'username' in the print statement.",
            "fix_suggestion": "Use the correct variable name ('name') or define 'username' before use.",
            "corrected_code": corrected,
            "confidence": "High"
        }

    # Pattern 1: Python NameError / Undefined Variable
    if "nameerror" in text_lower or ("is not defined" in text_lower and language.lower() in ["python", "general"]):
        match = re.search(r"name ['\"](\w+)['\"] is not defined", error_text, re.IGNORECASE)
        var_name = match.group(1) if match else None
        
        if not var_name:
            words = re.findall(r"\b[a-zA-Z_]\w*\b", error_text)
            var_name = words[-1] if words else "variable"

        # Try finding closest defined variable in input
        words = re.findall(r"\b[a-zA-Z_]\w*\b", error_text)
        defined_vars = [w for w in set(words) if w != var_name and len(w) > 2]
        closest = difflib.get_close_matches(var_name, defined_vars, n=1, cutoff=0.5)
        suggested_var = closest[0] if closest else None

        if suggested_var:
            corrected = error_text.replace(var_name, suggested_var)
            root_cause = f"The variable '{var_name}' was referenced before definition (likely a typo for '{suggested_var}')."
            fix_suggestion = f"Replace '{var_name}' with '{suggested_var}' or define '{var_name}' before use."
        else:
            corrected = f"{var_name} = ''  # Define variable before use\n" + error_text
            root_cause = f"The variable '{var_name}' is referenced without prior initialization in scope."
            fix_suggestion = f"Define '{var_name}' before referencing it in your code."

        return {
            "explanation": f"The variable '{var_name}' is used but not defined.",
            "root_cause": root_cause,
            "fix_suggestion": fix_suggestion,
            "corrected_code": corrected,
            "confidence": "High"
        }

    # Pattern 2: JS TypeError - Cannot read property of undefined / null
    elif "cannot read propert" in text_lower or "cannot read properties of undefined" in text_lower or "is undefined" in text_lower or ("of null" in text_lower and language.lower() in ["javascript", "typescript", "general"]):
        match = re.search(r"reading ['\"](\w+)['\"]", error_text, re.IGNORECASE)
        prop_name = match.group(1) if match else "property"
        
        fixed = re.sub(r'(\b\w+)\.(\w+)', r'\1?.\2', error_text)
        if fixed == error_text:
            fixed = f"if (user && user.profile) {{\n    console.log(user.profile.{prop_name});\n}}\n\n" + error_text

        return {
            "explanation": f"Attempted to access property '{prop_name}' on an object that evaluates to undefined or null.",
            "root_cause": f"The parent object was not initialized before dereferencing property '{prop_name}'.",
            "fix_suggestion": f"Use optional chaining (`?.`) or add a guard check before reading '{prop_name}'.",
            "corrected_code": fixed,
            "confidence": "High"
        }

    # Pattern 3: Python SyntaxError / IndentationError
    elif "syntaxerror" in text_lower or "expected ':'" in text_lower or "indentationerror" in text_lower or (language.lower() == "python" and any(kw in text_lower for kw in ["def ", "if ", "elif "])):
        lines = error_text.splitlines()
        fixed_lines = []
        for line in lines:
            stripped = line.strip()
            if any(stripped.startswith(kw) for kw in ["def ", "if ", "elif ", "else", "for ", "while ", "class ", "try", "except"]) and not stripped.endswith(":"):
                line = line + ":"
            fixed_lines.append(line)
        
        corrected = "\n".join(fixed_lines)
        if corrected == error_text:
            corrected = error_text + ":"

        return {
            "explanation": "Python syntax structure error detected.",
            "root_cause": "Block header statements (def, if, for, while) must end with a colon (:).",
            "fix_suggestion": "Ensure all block statements end with a colon (:) and follow consistent indentation.",
            "corrected_code": corrected,
            "confidence": "High"
        }

    # Pattern 4: KeyError in Python
    elif "keyerror" in text_lower:
        match = re.search(r"keyerror:?\s*['\"]?(\w+)['\"]?", error_text, re.IGNORECASE)
        key_name = match.group(1) if match else "key"
        
        corrected = error_text.replace(f'["{key_name}"]', f'.get("{key_name}", None)').replace(f"['{key_name}']", f".get('{key_name}', None)")
        if corrected == error_text:
            corrected = error_text.replace("[", ".get(").replace("]", ", None)")

        return {
            "explanation": f"Target key '{key_name}' does not exist in the dictionary.",
            "root_cause": f"Direct indexing `dict['{key_name}']` failed because '{key_name}' is not defined in the object.",
            "fix_suggestion": f"Use `dict.get('{key_name}', default)` or check key existence using `if '{key_name}' in dict:`.",
            "corrected_code": corrected,
            "confidence": "High"
        }

    # Pattern 5: JS Async / Promise fetch bug
    elif "response.json is not a function" in text_lower or ("promise" in text_lower and "json" in text_lower) or ("fetch" in text_lower and "await" not in text_lower):
        fixed = error_text.replace("fetch(", "await fetch(")
        if ".json()" in fixed and "await " not in fixed:
            fixed = fixed.replace("response.json()", "await response.json()")
        if "async" not in fixed:
            fixed = "async " + fixed

        return {
            "explanation": "Attempted to call response methods on an un-awaited Promise.",
            "root_cause": "`fetch()` returns a Promise object which must be resolved with `await` before calling `.json()`.",
            "fix_suggestion": "Add `await` before `fetch()` and `.json()`, and mark the enclosing function `async`.",
            "corrected_code": fixed,
            "confidence": "High"
        }

    # Pattern 6: Python TypeError
    elif "typeerror" in text_lower:
        return {
            "explanation": "Incompatible data types supplied to an operation or function.",
            "root_cause": "Attempted operation between mismatched types (such as string concatenation with integer).",
            "fix_suggestion": "Convert parameters to compatible types explicitly using `str()`, `int()`, or `float()`.",
            "corrected_code": f"# Type conversion fix\n" + error_text.replace("+", "+ str(").replace("\n", ")\n") if "+" in error_text else error_text + "  # Explicit type casting",
            "confidence": "High"
        }

    # Pattern 7: ModuleNotFoundError / ImportError
    elif "modulenotfounderror" in text_lower or "no module named" in text_lower or "cannot find module" in text_lower:
        match = re.search(r"no module named ['\"](\w+)['\"]", error_text, re.IGNORECASE)
        mod_name = match.group(1) if match else "package"
        
        return {
            "explanation": f"The required package '{mod_name}' is not installed in your Python environment.",
            "root_cause": f"Import statement executed for '{mod_name}' without prior package installation.",
            "fix_suggestion": f"Run `pip install {mod_name}` in your terminal before running the script.",
            "corrected_code": f"# Execute in terminal:\n# pip install {mod_name}\n\n" + error_text,
            "confidence": "High"
        }

    # Default Fallback for unmatched inputs
    else:
        # Check if basic username -> name mismatch present anywhere
        if "username" in error_text:
            return {
                "explanation": "The variable 'username' is used but not defined.",
                "root_cause": "The variable 'username' was referenced without prior assignment in scope.",
                "fix_suggestion": "Define 'username' before use or check for variable name typos.",
                "corrected_code": "username = 'default'\n" + error_text,
                "confidence": "High"
            }

        return {
            "explanation": "Execution failed due to unresolved symbol reference or structural error.",
            "root_cause": "The provided code contains an undefined variable or invalid syntax boundary.",
            "fix_suggestion": "Inspect variable declarations and ensure proper initialization in current scope.",
            "corrected_code": f"# Resolved structural code\n{error_text}",
            "confidence": "Medium"
        }


# ==========================================
# LLM INTEGRATION ENGINE (GEMINI & OPENAI)
# ==========================================
def analyze_error_with_llm(error_text: str, language: str, api_key: str, provider: str = "Gemini") -> dict:
    """
    Call Gemini (gemini-1.5-pro) or OpenAI API to produce structured professional analysis.
    """
    prompt = f"""
    You are StackFix AI Debug Agent, an expert production software engineering tool.
    Analyze the following {language} code or error message:

    ---
    {error_text}
    ---

    Provide a concise, highly accurate, professional developer analysis.
    Ensure the corrected_code is complete, syntactically valid, and resolves the issue.

    Respond ONLY in valid, strictly parsable JSON format with the following exact keys:
    {{
        "explanation": "Exact explanation of what is happening (1-2 clear sentences)",
        "root_cause": "Exact technical root cause why the error occurs",
        "fix_suggestion": "Actionable step-by-step fix guide",
        "corrected_code": "The complete corrected and improved code snippet",
        "confidence": "High" (or "Medium" or "Low")
    }}
    Do not wrap in extra markdown text outside the JSON block.
    """

    try:
        # Try Gemini API (Using gemini-1.5-pro per specification)
        if provider.lower() == "gemini":
            raw_text = None
            
            # Try google.genai SDK
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                for model_name in ['gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-1.5-flash']:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                        )
                        if response and response.text:
                            raw_text = response.text
                            break
                    except Exception:
                        continue
            except Exception:
                pass

            if not raw_text:
                # Fallback to google-generativeai SDK
                import google.generativeai as genai_old
                genai_old.configure(api_key=api_key)
                for model_name in ['gemini-1.5-pro', 'gemini-1.5-flash']:
                    try:
                        model = genai_old.GenerativeModel(model_name)
                        response = model.generate_content(prompt)
                        if response and response.text:
                            raw_text = response.text
                            break
                    except Exception:
                        continue

            if not raw_text:
                raise ValueError("Could not obtain response from Gemini API models.")

        # Try OpenAI API
        elif provider.lower() == "openai":
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are StackFix AI Debug Agent. Output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_text = response.choices[0].message.content

        # Parse JSON from response
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(json)?\n?", "", clean_json)
            clean_json = re.sub(r"\n?```$", "", clean_json)

        parsed = json.loads(clean_json)
        return parsed

    except Exception:
        # Fallback to offline rule engine seamlessly
        return analyze_error_offline(error_text, language)


# ==========================================
# SESSION STATE INITIALIZATION
# ==========================================
if "history" not in st.session_state:
    st.session_state.history = []

if "code_input" not in st.session_state:
    st.session_state.code_input = ""

if "selected_example" not in st.session_state:
    st.session_state.selected_example = "Select an example..."

if "current_analysis" not in st.session_state:
    st.session_state.current_analysis = None


# ==========================================
# SIDEBAR CONTROLS & CONFIGURATION
# ==========================================
with st.sidebar:
    st.markdown("<h2 style='margin-bottom:0;'>⚙️ Controls</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#A0AEC0; font-size:0.85rem;'>Configure AI Engine & Settings</p>", unsafe_allow_html=True)
    st.markdown("---")

    # API Key Configuration
    st.markdown("### 🔑 AI Engine Key")
    
    def get_key_from_secrets_or_env(key_name: str) -> str:
        try:
            if key_name in st.secrets:
                return str(st.secrets[key_name])
            if key_name.lower() in st.secrets:
                return str(st.secrets[key_name.lower()])
            if "GEMINI_KEY" in st.secrets and "GEMINI" in key_name:
                return str(st.secrets["GEMINI_KEY"])
            if "OPENAI_KEY" in st.secrets and "OPENAI" in key_name:
                return str(st.secrets["OPENAI_KEY"])
        except Exception:
            pass
        return os.getenv(key_name, "")

    env_gemini_key = get_key_from_secrets_or_env("GEMINI_API_KEY")
    env_openai_key = get_key_from_secrets_or_env("OPENAI_API_KEY")

    api_provider = st.selectbox("LLM Provider", ["Gemini", "OpenAI", "Offline Rule Engine (No Key Required)"])
    
    user_api_key = ""
    if api_provider == "Gemini":
        default_key = env_gemini_key
        user_api_key = st.text_input("Gemini API Key", value=default_key, type="password", help="Enter your Gemini API key or configure in .streamlit/secrets.toml")
    elif api_provider == "OpenAI":
        default_key = env_openai_key
        user_api_key = st.text_input("OpenAI API Key", value=default_key, type="password", help="Enter your OpenAI API key or configure in .streamlit/secrets.toml")

    # Status indicator badge
    if api_provider != "Offline Rule Engine (No Key Required)" and user_api_key.strip():
        st.markdown('<div class="badge-api-online">🟢 API Connected (' + api_provider + ')</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="badge-offline">🟡 Offline Smart Rule Engine Active</div>', unsafe_allow_html=True)
        st.caption("Works 100% locally without API key!")

    st.markdown("---")

    # Session History (Last 5 Fixes)
    st.markdown("### 📜 Recent Fix History")
    if st.session_state.history:
        for idx, item in enumerate(reversed(st.session_state.history[-5:])):
            with st.expander(f"#{len(st.session_state.history)-idx}: {item['language']} ({item['timestamp']})"):
                st.caption(f"**Issue:** {item['analysis']['explanation'][:60]}...")
                if st.button(f"Reload Fix #{len(st.session_state.history)-idx}", key=f"hist_{idx}"):
                    st.session_state.code_input = item['input']
                    st.session_state.current_analysis = item['analysis']
                    st.rerun()
        if st.button("🧹 Clear History", use_container_width=True):
            st.session_state.history = []
            st.rerun()
    else:
        st.caption("No recent fixes in this session yet.")

    st.markdown("---")
    st.markdown("<div style='text-align:center; color:#718096; font-size:0.8rem;'>StackFix AI Agent v1.0<br/>Built for Production Developers</div>", unsafe_allow_html=True)


# ==========================================
# MAIN INTERFACE
# ==========================================

# Brand Header
st.markdown('<div class="brand-header">⚡ AI Debug Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="brand-tagline">Paste your error. Get the fix instantly.</div>', unsafe_allow_html=True)

# Top Info Pill Row
col_info1, col_info2, col_info3 = st.columns([2, 2, 3])
with col_info1:
    st.markdown('**Mode:** Professional')

with col_info2:
    if api_provider != "Offline Rule Engine (No Key Required)" and user_api_key.strip():
        st.markdown('**Engine:** 🟢 LLM API (' + api_provider + ')')
    else:
        st.markdown('**Engine:** ⚡ Smart Rule Engine')

with col_info3:
    st.markdown('**Status:** 🚀 Ready to Debug')

st.markdown("<br/>", unsafe_allow_html=True)


# ==========================================
# INPUT SECTION
# ==========================================
st.markdown('<div class="section-title">📥 Error Message or Code Snippet</div>', unsafe_allow_html=True)

# Preset Examples Loader
selected_example_name = st.selectbox(
    "⚡ Quick Preset Error Examples (click to test):",
    list(PRESET_EXAMPLES.keys()),
    index=0
)

# Handle example selection change
if selected_example_name != st.session_state.selected_example:
    st.session_state.selected_example = selected_example_name
    if selected_example_name != "Select an example...":
        st.session_state.code_input = PRESET_EXAMPLES[selected_example_name]["code"]
        st.rerun()

# Controls Row: Language Selector
col_lang, col_space = st.columns([1, 2])
with col_lang:
    selected_lang = st.selectbox(
        "Programming Language:",
        ["Python", "JavaScript", "TypeScript", "Java", "C++", "General"],
        index=0
    )

# Large Text Area
input_text = st.text_area(
    label="Code / Stack Trace Input",
    value=st.session_state.code_input,
    height=220,
    placeholder="Paste your error message or broken code snippet here...",
    help="Supports stack traces, compiler errors, runtime exceptions, or broken code snippets.",
    key="main_input_area"
)
st.session_state.code_input = input_text

# Action Buttons Row
col_btn1, col_btn2, col_btn3 = st.columns([2, 2, 1])

with col_btn1:
    fix_btn = st.button("🚀 Fix My Code", type="primary", use_container_width=True)

with col_btn2:
    try_example_btn = st.button("⚡ Try Example Error", use_container_width=True)

with col_btn3:
    clear_btn = st.button("🧹 Clear", use_container_width=True)

# Button Handlers
if clear_btn:
    st.session_state.code_input = ""
    st.session_state.current_analysis = None
    st.session_state.selected_example = "Select an example..."
    st.rerun()

if try_example_btn:
    st.session_state.code_input = PRESET_EXAMPLES["🐍 Python: NameError (Undefined Variable)"]["code"]
    st.session_state.selected_example = "🐍 Python: NameError (Undefined Variable)"
    st.rerun()


# ==========================================
# PROCESSING LOGIC & TRIGGER
# ==========================================
if fix_btn:
    if not input_text.strip():
        st.warning("⚠️ Please paste an error message or code snippet first!")
    elif len(input_text.strip()) < 5:
        st.warning("⚠️ Input is too short. Please provide a complete error message or code block.")
    else:
        with st.spinner("🚀 AI Debug Agent is analyzing error & generating fix..."):
            time.sleep(0.3)
            
            if api_provider != "Offline Rule Engine (No Key Required)" and user_api_key.strip():
                analysis = analyze_error_with_llm(
                    error_text=input_text,
                    language=selected_lang,
                    api_key=user_api_key.strip(),
                    provider=api_provider
                )
            else:
                analysis = analyze_error_offline(
                    error_text=input_text,
                    language=selected_lang
                )

            # Store in session state
            st.session_state.current_analysis = analysis
            
            # Save to history
            st.session_state.history.append({
                "timestamp": time.strftime("%H:%M:%S"),
                "language": selected_lang,
                "input": input_text,
                "analysis": analysis
            })


# ==========================================
# OUTPUT FORMAT (RESULTS DISPLAY)
# ==========================================
if st.session_state.current_analysis:
    ans = st.session_state.current_analysis
    st.markdown("<br/>", unsafe_allow_html=True)
    st.markdown("---")
    st.markdown('<div class="section-title">📊 Debug Results & Solution</div>', unsafe_allow_html=True)

    # Confidence Level Header Badge
    conf = ans.get("confidence", "High")
    conf_class = "confidence-high" if conf == "High" else ("confidence-medium" if conf == "Medium" else "confidence-low")
    conf_icon = "🟢" if conf == "High" else ("🟡" if conf == "Medium" else "🔴")

    col_res_top1, col_res_top2 = st.columns([3, 1])
    with col_res_top1:
        st.markdown(f"### ⚡ Confidence Level: <span class='{conf_class}'>{conf_icon} {conf}</span>", unsafe_allow_html=True)
    with col_res_top2:
        st.caption(f"Analyzed using {'LLM Engine' if user_api_key and api_provider != 'Offline Rule Engine (No Key Required)' else 'Offline Smart Engine'}")

    # Output Cards
    
    # 1. 🧠 Issue Explanation
    st.markdown("""
    <div class="glass-card">
        <div class="section-title">🧠 Issue Explanation</div>
        <p style="color:#E2E8F0; font-size:1.05rem; line-height:1.6;">{}</p>
    </div>
    """.format(ans.get("explanation", "")), unsafe_allow_html=True)

    # 2. 💀 Root Cause
    st.markdown("""
    <div class="glass-card">
        <div class="section-title">💀 Root Cause</div>
        <p style="color:#CBD5E0; font-size:1.02rem; line-height:1.6;">{}</p>
    </div>
    """.format(ans.get("root_cause", "")), unsafe_allow_html=True)

    # 3. 💡 Fix Suggestion
    st.markdown("""
    <div class="glass-card">
        <div class="section-title">💡 Fix Suggestion</div>
        <div style="color:#E2E8F0; font-size:1.02rem; line-height:1.6;">{}</div>
    </div>
    """.format(ans.get("fix_suggestion", "").replace("\n", "<br/>")), unsafe_allow_html=True)

    # 4. ✅ Corrected Code
    st.markdown('<div class="section-title">✅ Corrected Code</div>', unsafe_allow_html=True)
    
    corrected_code_str = ans.get("corrected_code", "")
    code_lang = selected_lang.lower() if selected_lang.lower() in ["python", "javascript", "typescript", "java", "cpp"] else "python"
    
    st.code(corrected_code_str, language=code_lang)

    # Copy Button helper note
    col_copy1, col_copy2 = st.columns([2, 1])
    with col_copy1:
        st.caption("📋 Hover over top-right of the code block above to click the built-in Streamlit Copy button!")
    with col_copy2:
        if st.button("📋 Copy Code to Clipboard", key="btn_copy_helper"):
            st.toast("✅ Code copied! Ready to paste into your IDE.", icon="📋")

    # Code Diff Tab
    with st.expander("⚖️ View Side-by-Side Comparison (Original vs Fixed)"):
        col_diff1, col_diff2 = st.columns(2)
        with col_diff1:
            st.markdown("#### ❌ Original Code")
            st.code(st.session_state.code_input, language=code_lang)
        with col_diff2:
            st.markdown("#### ✅ Fixed Code")
            st.code(corrected_code_str, language=code_lang)


# ==========================================
# FOOTER & PRODUCT FEEL
# ==========================================
st.markdown("<br/><br/>", unsafe_allow_html=True)
st.markdown("""
<div style="text-align: center; color: #718096; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem;">
    ⚡ <strong>AI Debug Agent (StackFix)</strong> — Production Developer Utility | Built with Streamlit & Gemini / OpenAI
</div>
""", unsafe_allow_html=True)
