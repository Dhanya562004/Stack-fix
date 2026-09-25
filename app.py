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
# CUSTOM CSS STYLING (DARK THEME & GLASSMORPHISM)
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

    .badge-savage {
        background-color: rgba(245, 101, 101, 0.15);
        color: #F56565;
        border: 1px solid rgba(245, 101, 101, 0.3);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 700;
    }

    .badge-normal {
        background-color: rgba(66, 153, 225, 0.15);
        color: #4299E1;
        border: 1px solid rgba(66, 153, 225, 0.3);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 700;
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

    /* Savage Banner */
    .savage-quote {
        background: linear-gradient(90deg, rgba(245,101,101,0.12) 0%, rgba(155,81,224,0.12) 100%);
        border-left: 4px solid #F56565;
        padding: 12px 16px;
        border-radius: 0 12px 12px 0;
        font-style: italic;
        color: #FEB2B2;
        margin-bottom: 1rem;
        font-weight: 500;
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
    "🐍 Python: NameError (Typo in variable)": {
        "language": "Python",
        "code": """def calculate_total_price(price, tax_rate, discount):
    subtotal = price * (1 - discunt)  # Typo in variable name
    total = subtotal + (subtotal * tax_rate)
    return total

items_cost = 150.0
tax = 0.08
disc = 0.15

print("Final Invoice:", calculate_total_price(items_cost, tax, disc))
# Traceback (most recent call last):
# NameError: name 'discunt' is not defined"""
    },
    "🟨 JS: TypeError (Cannot read properties of undefined)": {
        "language": "JavaScript",
        "code": """function renderUserProfile(user) {
    console.log("Loading profile for:", user.profile.name);
    const avatarUrl = user.profile.avatar.url;
    return `<img src="${avatarUrl}" /> <h3>${user.profile.name}</h3>`;
}

// Bug: Passing empty user object without nested profile property
const currentUser = { id: 892, role: "developer" };
renderUserProfile(currentUser);

// TypeError: Cannot read properties of undefined (reading 'name')"""
    },
    "🐍 Python: Indentation & Syntax Error": {
        "language": "Python",
        "code": """def process_user_data(user_id, status)
    if status == "active"
    print("User is active")
        user_record = {"id": user_id, "active": True}
      return user_record

# SyntaxError: expected ':'
# IndentationError: unexpected indent"""
    },
    "🟨 JS: Async/Await Promise Bug": {
        "language": "JavaScript",
        "code": """async function fetchUserData(userId) {
    // Missing await keyword on fetch response
    const response = fetch(`https://api.example.com/users/${userId}`);
    const data = response.json(); // TypeError: response.json is not a function
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

# Trying to access non-existent key
db_password = config["password"]
print("Connected with pass:", db_password)

# KeyError: 'password'"""
    },
    "⚡ General: Null Reference / Unhandled Exception": {
        "language": "General",
        "code": """String inputStr = null;
int length = inputStr.length(); // NullPointerException in Java / C#

// Unhandled Null Reference Error"""
    }
}


# ==========================================
# RULE-BASED OFFLINE ENGINE (SMART FALLBACK)
# ==========================================
def analyze_error_offline(error_text: str, language: str, savage_mode: bool = False) -> dict:
    """
    Intelligent pattern-matching diagnostic engine that analyzes error messages
    and code snippets without requiring an external API key.
    """
    text_lower = error_text.lower()
    
    # Default fallback structured output
    res = {
        "explanation": "The code encountered an execution or syntax issue that prevented successful evaluation.",
        "root_cause": "An unexpected token, undefined variable reference, or type mismatch occurred during execution.",
        "fix_suggestion": "Check variable declarations, ensure required modules are imported, and verify syntax integrity.",
        "corrected_code": error_text,
        "confidence": "Medium",
        "savage_quote": "This code is running purely on hope and broken assumptions 💀"
    }

    # Pattern 1: Python NameError
    if "nameerror" in text_lower or ("is not defined" in text_lower and language.lower() in ["python", "general"]):
        match = re.search(r"name ['\"](\w+)['\"] is not defined", error_text, re.IGNORECASE)
        var_name = match.group(1) if match else "a variable"
        
        # Try to find typos in the code
        words = re.findall(r"\b[a-zA-Z_]\w*\b", error_text)
        defined_vars = [w for w in set(words) if w != var_name and len(w) > 2]
        closest = difflib.get_close_matches(var_name, defined_vars, n=1, cutoff=0.5)
        suggested_var = closest[0] if closest else None

        res["explanation"] = f"Python tried to use `{var_name}`, but it hasn't been declared or defined in the current scope yet."
        res["root_cause"] = f"Variable `{var_name}` was referenced before assignment" + (f" (likely a typo for `{suggested_var}`)." if suggested_var else ".")
        res["fix_suggestion"] = f"1. Verify the spelling of `{var_name}`.\n2. Ensure `{var_name}` is initialized before calling it.\n3. Check variable scope (global vs function local)."
        
        if suggested_var:
            res["corrected_code"] = error_text.replace(var_name, suggested_var)
        else:
            res["corrected_code"] = f"# Initialize '{var_name}' before use\n{var_name} = None\n\n" + error_text
        res["confidence"] = "High"
        res["savage_quote"] = f"You called `{var_name}` like it's your best friend, but Python has literally never met them in its life 💀"

    # Pattern 2: JS TypeError - Cannot read property of undefined / null
    elif "cannot read propert" in text_lower or "cannot read properties of undefined" in text_lower or "is undefined" in text_lower or ("of null" in text_lower and language.lower() in ["javascript", "typescript", "general"]):
        match = re.search(r"reading ['\"](\w+)['\"]", error_text, re.IGNORECASE)
        prop_name = match.group(1) if match else "property"
        
        res["explanation"] = f"JavaScript attempted to access the property `{prop_name}` on an object that is `undefined` or `null`."
        res["root_cause"] = f"The parent object being accessed was not initialized or returned `undefined` from an API/function call."
        res["fix_suggestion"] = f"1. Use optional chaining (`?.`) like `object?.{prop_name}` to safely read properties.\n2. Add default values or null checks before dereferencing.\n3. Verify API payloads or props passed into the function."
        
        # Quick regex optional chaining attempt
        fixed = re.sub(r'(\b\w+)\.(\w+)', r'\1?.\2', error_text)
        res["corrected_code"] = fixed if fixed != error_text else f"// Use optional chaining or guard clause\nif (obj) {{\n  console.log(obj.{prop_name});\n}}\n\n" + error_text
        res["confidence"] = "High"
        res["savage_quote"] = f"Trying to read `{prop_name}` off `undefined` is like opening an empty fridge and expecting a 3-course meal 💀"

    # Pattern 3: Python SyntaxError (missing colon, unexpected indent)
    elif "syntaxerror" in text_lower or "expected ':'" in text_lower or "indentationerror" in text_lower:
        is_colon = "expected ':'" in text_lower or ":" not in error_text
        
        res["explanation"] = "The Python interpreter encountered code that violates Python's syntax rules."
        res["root_cause"] = "Missing colon `:` at the end of a block header (def/if/for/while/class) or inconsistent indentation levels."
        res["fix_suggestion"] = "1. Ensure all `def`, `if`, `elif`, `else`, `for`, `while`, and `try` lines end with a colon `:`.\n2. Use consistent 4-space indentation throughout the file."
        
        lines = error_text.splitlines()
        fixed_lines = []
        for line in lines:
            stripped = line.strip()
            if any(stripped.startswith(kw) for kw in ["def ", "if ", "elif ", "else", "for ", "while ", "class ", "try", "except"]) and not stripped.endswith(":"):
                line = line + ":"
            fixed_lines.append(line)
        res["corrected_code"] = "\n".join(fixed_lines)
        res["confidence"] = "High"
        res["savage_quote"] = "Python colons are not optional recommendations, my friend. They are mandatory non-negotiables 💀"

    # Pattern 4: KeyError in Python
    elif "keyerror" in text_lower:
        match = re.search(r"keyerror:?\s*['\"]?(\w+)['\"]?", error_text, re.IGNORECASE)
        key_name = match.group(1) if match else "key"
        
        res["explanation"] = f"The dictionary does not contain the key `{key_name}`."
        res["root_cause"] = f"Direct dictionary lookup `dict['{key_name}']` failed because `{key_name}` was not present."
        res["fix_suggestion"] = f"1. Use `dict.get('{key_name}', default_value)` instead of direct indexing.\n2. Check if the key exists using `if '{key_name}' in dict:` before accessing."
        
        res["corrected_code"] = error_text.replace(f'["{key_name}"]', f'.get("{key_name}", None)').replace(f"['{key_name}']", f".get('{key_name}', None)")
        res["confidence"] = "High"
        res["savage_quote"] = f"Searching for `{key_name}` in that dictionary is like looking for your keys in someone else's house 💀"

    # Pattern 5: JS Async / Await / Response.json is not a function
    elif "response.json is not a function" in text_lower or ("promise" in text_lower and "json" in text_lower) or ("fetch" in text_lower and "await" not in text_lower):
        res["explanation"] = "The `fetch()` function returns a `Promise`, but code tried to call `.json()` synchronously without awaiting it."
        res["root_cause"] = "Missing `await` keyword before `fetch(...)` or before `response.json()`."
        res["fix_suggestion"] = "1. Add `await` before `fetch(...)` call.\n2. Add `await` before `response.json()`.\n3. Ensure the enclosing function is marked `async`."
        
        fixed = error_text.replace("fetch(", "await fetch(").replace(".json()", ".json()")
        if "await fetch" in fixed and "async" not in fixed:
            fixed = "// Ensure function is async\n" + fixed
        res["corrected_code"] = fixed
        res["confidence"] = "High"
        res["savage_quote"] = "Promises are like IOUs. You can't spend an IOU until you actually await the cash 💀"

    # Pattern 6: Python TypeError (unsupported operand types or non-callable)
    elif "typeerror" in text_lower:
        if "unsupported operand" in text_lower:
            res["explanation"] = "An operation was attempted between incompatible data types (e.g. adding string + int)."
            res["root_cause"] = "Type mismatch during arithmetic or concatenation operations."
            res["fix_suggestion"] = "Convert operands to matching types using `int()`, `float()`, or `str()` explicit casting."
            res["savage_quote"] = "You can't add apples to oranges without explicit casting. Basic arithmetic rules apply! 💀"
        elif "not callable" in text_lower:
            res["explanation"] = "Code attempted to invoke a non-function variable as if it were a function (e.g., `my_var()`)."
            res["root_cause"] = "Variable name collision overwriting a function or accidentally putting parentheses after a non-callable property."
            res["fix_suggestion"] = "Remove parentheses or rename local variables that shade built-in functions."
            res["savage_quote"] = "Putting `()` after a string won't magically make it a function, no matter how hard you pray 💀"
        else:
            res["explanation"] = "A function was called with invalid argument types or wrong number of positional arguments."
            res["root_cause"] = "Function definition signature doesn't match the passed parameters."
            res["fix_suggestion"] = "Check the function parameters and ensure arguments match expected types."
            res["savage_quote"] = "Mismatching function signatures is the fastest way to confuse Python 💀"
        res["confidence"] = "High"

    # Pattern 7: ModuleNotFoundError / ImportError
    elif "modulenotfounderror" in text_lower or "no module named" in text_lower or "cannot find module" in text_lower:
        match = re.search(r"no module named ['\"](\w+)['\"]", error_text, re.IGNORECASE)
        mod_name = match.group(1) if match else "package"
        
        res["explanation"] = f"The required package/module `{mod_name}` is not installed in your Python environment."
        res["root_cause"] = f"Import statement `import {mod_name}` executed without the package installed in pip / virtualenv."
        res["fix_suggestion"] = f"1. Run terminal command: `pip install {mod_name}`\n2. Verify you are in the correct virtual environment (`venv`)."
        res["corrected_code"] = f"# Run in terminal first:\n# pip install {mod_name}\n\n" + error_text
        res["confidence"] = "High"
        res["savage_quote"] = f"You can't import `{mod_name}` out of thin air. Pip install it first! 💀"

    # Pattern 8: NullPointerException / NoneType has no attribute
    elif "nonetype" in text_lower or "nullpointerexception" in text_lower or "has no attribute" in text_lower:
        match = re.search(r"['\"]nonetype['\"] object has no attribute ['\"](\w+)['\"]", error_text, re.IGNORECASE)
        attr_name = match.group(1) if match else "attribute"
        
        res["explanation"] = f"Tried to call attribute/method `{attr_name}` on a variable that evaluates to `None`."
        res["root_cause"] = "Function or DB query returned `None` instead of expected object, and code dereferenced it immediately."
        res["fix_suggestion"] = f"1. Add a guard clause: `if obj is not None:` before accessing `{attr_name}`.\n2. Ensure functions return valid instances instead of falling through to implicit `None`."
        res["corrected_code"] = f"# Add guard check for None:\nif result is not None:\n    result.{attr_name}()\nelse:\n    print('Warning: Object is None')\n\n" + error_text
        res["confidence"] = "High"
        res["savage_quote"] = f"Calling `{attr_name}` on `None` is like trying to drive a car that doesn't exist 💀"

    # Generic Smart Response for non-matched errors
    else:
        res["explanation"] = "An unhandled exception or code defect was detected."
        res["root_cause"] = "The input contains code logic errors, missing variable initializations, or runtime syntax failures."
        res["fix_suggestion"] = "1. Inspect the stack trace for line numbers.\n2. Verify input types and variable scopes.\n3. Add defensive try-catch error handling."
        res["confidence"] = "Medium"
        res["savage_quote"] = "This code runs on pure luck and developer optimism 💀"

    return res


# ==========================================
# LLM INTEGRATION ENGINE (GEMINI & OPENAI)
# ==========================================
def analyze_error_with_llm(error_text: str, language: str, savage_mode: bool, api_key: str, provider: str = "Gemini") -> dict:
    """
    Call Gemini or OpenAI API to produce structured analysis with fallback on failure.
    """
    tone_instruction = ""
    if savage_mode:
        tone_instruction = """
        TONE REQUIREMENT (SAVAGE MODE 😈):
        Be witty, funny, sarcastic, and roast the code/error like an overly honest senior dev, BUT keep explanations completely accurate, safe, and helpful!
        Include a 1-sentence hilarious roast quote for the savage_quote field (e.g. "This code runs on hope and broken assumptions 💀").
        """
    else:
        tone_instruction = """
        TONE REQUIREMENT (NORMAL MODE 😇):
        Be professional, clear, encouraging, structured, and easy for beginners to understand.
        For savage_quote, provide a quick encouraging developer tip.
        """

    prompt = f"""
    You are AI Debug Agent (StackFix), an expert production developer tool.
    Analyze the following {language} code or error message:

    ---
    {error_text}
    ---

    {tone_instruction}

    Respond ONLY in valid, strictly parsable JSON format with the following exact keys:
    {{
        "explanation": "Clear explanation of what is happening (2-3 sentences)",
        "root_cause": "Exact technical root cause why the error occurs",
        "fix_suggestion": "Actionable step-by-step fix guide",
        "corrected_code": "The complete improved and fixed code snippet",
        "confidence": "High" (or "Medium" or "Low"),
        "savage_quote": "A 1-sentence witty roast or tip"
    }}
    Do not wrap in extra markdown text outside the JSON block.
    """

    try:
        # Try Gemini API
        if provider.lower() == "gemini":
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                )
                raw_text = response.text
            except Exception:
                # Fallback to google-generativeai SDK
                import google.generativeai as genai_old
                genai_old.configure(api_key=api_key)
                model = genai_old.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                raw_text = response.text

        # Try OpenAI API
        elif provider.lower() == "openai":
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are AI Debug Agent. Output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            raw_text = response.choices[0].message.content

        # Parse JSON from response
        # Clean potential markdown code blocks
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(json)?\n?", "", clean_json)
            clean_json = re.sub(r"\n?```$", "", clean_json)

        parsed = json.loads(clean_json)
        return parsed

    except Exception as e:
        # If API fails for any reason (invalid key, rate limit, network), fallback gracefully!
        fallback_res = analyze_error_offline(error_text, language, savage_mode)
        fallback_res["explanation"] += f" (Note: API call experienced an issue: {str(e)[:60]}... Switched to Smart Rule Engine)"
        return fallback_res


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
    st.markdown("<p style='color:#A0AEC0; font-size:0.85rem;'>Configure API & Debugging Modes</p>", unsafe_allow_html=True)
    st.markdown("---")

    # 1. Tone Mode Selector
    st.markdown("### 🎭 Tone Mode")
    savage_toggle = st.toggle("Savage Mode 😈", value=False, help="Toggle between Normal professional tone and Savage witty developer humor!")
    
    if savage_toggle:
        st.markdown('<span class="badge-savage">😈 SAVAGE MODE ACTIVE</span>', unsafe_allow_html=True)
        st.caption("Expect witty roasts & honest feedback!")
    else:
        st.markdown('<span class="badge-normal">😇 NORMAL MODE ACTIVE</span>', unsafe_allow_html=True)
        st.caption("Clean, encouraging, professional explanation.")

    st.markdown("---")

    # 2. API Key Configuration
    st.markdown("### 🔑 AI Engine Key")
    
    # Check environment variable first
    env_gemini_key = os.getenv("GEMINI_API_KEY", "")
    env_openai_key = os.getenv("OPENAI_API_KEY", "")

    api_provider = st.selectbox("LLM Provider", ["Gemini", "OpenAI", "Offline Rule Engine (No Key Required)"])
    
    user_api_key = ""
    if api_provider == "Gemini":
        default_key = env_gemini_key
        user_api_key = st.text_input("Gemini API Key", value=default_key, type="password", help="Enter your Gemini API key or set GEMINI_API_KEY in environment.")
    elif api_provider == "OpenAI":
        default_key = env_openai_key
        user_api_key = st.text_input("OpenAI API Key", value=default_key, type="password", help="Enter your OpenAI API key or set OPENAI_API_KEY in environment.")

    # Status indicator badge
    if api_provider != "Offline Rule Engine (No Key Required)" and user_api_key.strip():
        st.markdown('<div class="badge-api-online">🟢 API Connected (' + api_provider + ')</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="badge-offline">🟡 Offline Smart Rule Engine Active</div>', unsafe_allow_html=True)
        st.caption("Works 100% locally without API key!")

    st.markdown("---")

    # 3. Session History (Last 3-5 Fixes)
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
    st.markdown("<div style='text-align:center; color:#718096; font-size:0.8rem;'>StackFix AI Agent v1.0<br/>Built for Developers</div>", unsafe_allow_html=True)


# ==========================================
# MAIN INTERFACE
# ==========================================

# Brand Header
st.markdown('<div class="brand-header">⚡ AI Debug Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="brand-tagline">Paste your error. Get the fix instantly.</div>', unsafe_allow_html=True)

# Top Info Pill Row
col_info1, col_info2, col_info3 = st.columns([2, 2, 3])
with col_info1:
    if savage_toggle:
        st.markdown('**Mode:** 😈 Savage Tone')
    else:
        st.markdown('**Mode:** 😇 Normal Tone')

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
    # Pick Python NameError example as quick default
    st.session_state.code_input = PRESET_EXAMPLES["🐍 Python: NameError (Typo in variable)"]["code"]
    st.session_state.selected_example = "🐍 Python: NameError (Typo in variable)"
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
        # Show animated spinner with witty status
        spinner_messages = [
            "🧠 Analyzing stack trace & syntax tree...",
            "💀 Identifying root cause...",
            "💡 Generating optimized fix & clean code...",
            "⚡ Double checking variable scopes..."
        ]
        
        with st.spinner("🚀 AI Debug Agent is working magic..."):
            time.sleep(0.4) # Smooth UX feel
            
            if api_provider != "Offline Rule Engine (No Key Required)" and user_api_key.strip():
                analysis = analyze_error_with_llm(
                    error_text=input_text,
                    language=selected_lang,
                    savage_mode=savage_toggle,
                    api_key=user_api_key.strip(),
                    provider=api_provider
                )
            else:
                analysis = analyze_error_offline(
                    error_text=input_text,
                    language=selected_lang,
                    savage_mode=savage_toggle
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

    # Savage Quote Banner (if present or in savage mode)
    if savage_toggle or "savage_quote" in ans:
        quote = ans.get("savage_quote", "This code runs on hope and broken assumptions 💀")
        st.markdown(f'<div class="savage-quote">💬 <strong>Agent Commentary:</strong> "{quote}"</div>', unsafe_allow_html=True)

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

    # Code Diff Tab (Bonus Feature)
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
    ⚡ <strong>AI Debug Agent (StackFix)</strong> — Production AI Developer Utility | Built with Streamlit & Gemini / OpenAI
</div>
""", unsafe_allow_html=True)
