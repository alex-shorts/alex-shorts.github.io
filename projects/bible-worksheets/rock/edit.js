(function () {
  const saveBtn = document.getElementById("save-btn");
  if (!saveBtn) return;

  document.querySelectorAll(".verse-trace[contenteditable]").forEach(function (el) {
    el.addEventListener("focus", function () {
      el.classList.add("is-editing");
    });
    el.addEventListener("blur", function () {
      el.classList.remove("is-editing");
    });
  });

  saveBtn.addEventListener("click", function () {
    const clone = document.documentElement.cloneNode(true);
    const toolbar = clone.querySelector(".toolbar");
    if (toolbar) toolbar.remove();

    clone.querySelectorAll(".verse-trace.is-editing").forEach(function (el) {
      el.classList.remove("is-editing");
    });

    const html = "<!DOCTYPE html>\n" + clone.outerHTML;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    const base =
      (document.title || "worksheet")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "worksheet";
    a.href = URL.createObjectURL(blob);
    a.download = base + "-edited.html";
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();
