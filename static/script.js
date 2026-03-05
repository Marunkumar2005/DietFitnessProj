// Theme (dark mode)
(function initTheme(){
  const saved = localStorage.getItem("theme");
  if(saved === "dark") document.body.classList.add("dark");
})();

function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

// Loading button
function setLoading(isLoading){
  const btn = document.getElementById("predictBtn");
  if(!btn) return;

  if(isLoading){
    btn.style.opacity = "0.92";
    btn.style.pointerEvents = "none";
    btn.innerHTML = '<span class="spinner"></span> Predicting...';
  }else{
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Predict Now';
  }
}

// Clear form
function clearForm(){
  const form = document.querySelector("form");
  if(!form) return;

  Array.from(form.elements).forEach(el => {
    if(el.tagName === "INPUT") el.value = "";
  });

  setLoading(false);
  setBMIUI(null);
  document.querySelector("#predict").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Smart tag coloring (score / fitness)
function applyTags(){
  const scoreTag = document.getElementById("scoreTag");
  const fitnessTag = document.getElementById("fitnessTag");

  if(scoreTag){
    const m = scoreTag.textContent.match(/(\d+(\.\d+)?)/);
    const score = m ? parseFloat(m[1]) : null;
    if(score !== null){
      scoreTag.classList.remove("good","warn","bad");
      if(score >= 4) scoreTag.classList.add("good");
      else if(score >= 2) scoreTag.classList.add("warn");
      else scoreTag.classList.add("bad");
    }
  }

  if(fitnessTag){
    const t = fitnessTag.textContent.toLowerCase();
    fitnessTag.classList.remove("good","warn","bad");
    if(t.includes("high") || t.includes("fit") || t.includes("good")) fitnessTag.classList.add("good");
    else if(t.includes("medium") || t.includes("average") || t.includes("moderate")) fitnessTag.classList.add("warn");
    else if(t.includes("low") || t.includes("poor")) fitnessTag.classList.add("bad");
  }
}

// Helpers for BMI detection
function findInputByNames(names){
  for(const n of names){
    const el = document.querySelector(`#${CSS.escape(n)}`) || document.querySelector(`[name="${n}"]`);
    if(el) return el;
  }
  // fallback: search by placeholder/name/id content
  const all = Array.from(document.querySelectorAll("input"));
  for(const el of all){
    const key = ((el.name||"") + " " + (el.id||"") + " " + (el.placeholder||"")).toLowerCase();
    if(names.some(n => key.includes(String(n).toLowerCase()))) return el;
  }
  return null;
}

function computeBMI(){
  const wEl = findInputByNames(["weight","weight_kg","w","bodyweight","kg"]);
  const hEl = findInputByNames(["height","height_cm","h","cm","stature"]);
  if(!wEl || !hEl) return null;

  const w = parseFloat(wEl.value);
  let h = parseFloat(hEl.value);
  if(!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;

  // If height seems like cm, convert to meters
  if(h > 3) h = h / 100;

  const bmi = w / (h*h);
  return Math.round(bmi * 10) / 10;
}

function setBMIUI(bmi){
  const fill = document.getElementById("bmiFill");
  const tag  = document.getElementById("bmiTag");
  if(!fill || !tag) return;

  tag.classList.remove("good","warn","bad");

  if(bmi === null){
    tag.textContent = "BMI: --";
    fill.style.width = "0%";
    return;
  }

  // Map BMI 10..40 -> 0..100
  const min = 10, max = 40;
  const pct = Math.max(0, Math.min(100, ((bmi - min) / (max - min)) * 100));
  fill.style.width = pct + "%";
  tag.textContent = "BMI: " + bmi;

  if(bmi < 18.5) tag.classList.add("warn");
  else if(bmi < 25) tag.classList.add("good");
  else if(bmi < 30) tag.classList.add("warn");
  else tag.classList.add("bad");
}

function bindBMI(){
  const wEl = findInputByNames(["weight","weight_kg","w","bodyweight","kg"]);
  const hEl = findInputByNames(["height","height_cm","h","cm","stature"]);
  if(!wEl || !hEl) return;

  const handler = () => setBMIUI(computeBMI());
  wEl.addEventListener("input", handler);
  hEl.addEventListener("input", handler);
  handler();
}

// init
window.addEventListener("DOMContentLoaded", () => {
  applyTags();
  bindBMI();
  setLoading(false);
});