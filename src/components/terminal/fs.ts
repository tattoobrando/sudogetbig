/* A tiny in-memory filesystem so ls / cd / cat / touch actually work. */

export type Node = { type: "dir"; children: Record<string, Node> } | { type: "file"; content: string };

const file = (content: string): Node => ({ type: "file", content });
const dir = (children: Record<string, Node> = {}): Node => ({ type: "dir", children });

const meals = Object.fromEntries(
  Array.from({ length: 21 }, (_, i) => [
    `chicken_rice_broccoli_${String(i + 1).padStart(2, "0")}.txt`,
    file("chicken. rice. broccoli.\nseasoning: optimism"),
  ]),
);

export function createFS(): VFS {
  const root = dir({
    home: dir({
      gains: dir({
        "pr_history.log": file(
          [
            "2024-01-08  bench   60kg x 5   (form: interpretive)",
            "2024-06-17  bench   80kg x 3   (spotter: 'all you')",
            "2025-02-03  bench   95kg x 1   (disputed)",
            "2025-11-24  bench  100kg x 1   (current PR, deprecated)",
            "????-??-??  squat   [no data]",
          ].join("\n"),
        ),
        "program.yaml": file(
          [
            "split: push/pull/push",
            "frequency: 6x/week",
            "deload: when injured",
            "legs: # TODO",
            "cardio: null",
          ].join("\n"),
        ),
        "goals.md": file(
          "# Goals\n- [x] buy gym membership\n- [x] buy lifting belt\n- [x] buy matching shaker\n- [ ] go\n- [ ] see abs (local, not on a screen)",
        ),
        meal_prep: dir(meals),
        supplements: dir({
          "creatine.exe": file("binary file: 5g of white powder that makes you look like you've been crying (water retention)"),
          "preworkout.sh": file("#!/bin/sh\n# WARNING: 400mg caffeine\nexec heart --rate=max --tingles=yes"),
          "fish_oil.bin": file("burp."),
        }),
        ".secret_stash": file("3 rice cakes, half a protein bar, and a dream.\n\n(easter egg unlocked. tell no one.)"),
        ".bash_history": file("sudo get big\nsudo get big\nsudo get big\nwhy is it not working"),
      }),
    }),
    gym: dir({
      squat_rack: dir({ "occupied.txt": file("in use by someone doing curls. eta: never.") }),
      bench: dir({ "sweat.txt": file("previous user did not wipe it down. classic.") }),
      mirrors: dir({ "selfie_001.jpg": file("binary file (flexing, slightly blurry, extremely confident)") }),
      "rules.txt": file("1. rerack your weights\n2. no curls in the squat rack\n3. see rule 2\n4. grunting: allowed, within reason"),
    }),
    etc: dir({
      motd: file("Welcome to SwoleOS 24.04 LTS (Long Term Swole).\nUnauthorized gains will be prosecuted."),
      hostname: file("sudogetbig"),
    }),
    dev: dir({
      delts: file("mounted. boulder-edition."),
      null: file(""),
    }),
    bellyfat: dir({ "abs.txt": file("they're in here somewhere.") }),
  });

  let cwd = "/home/gains";
  const HOME = "/home/gains";

  const norm = (p: string): string => {
    let path = p.replace(/^~(?=\/|$)/, HOME);
    if (!path.startsWith("/")) path = `${cwd}/${path}`;
    const parts: string[] = [];
    for (const seg of path.split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    return "/" + parts.join("/");
  };

  const get = (p: string): Node | null => {
    const abs = norm(p);
    let node: Node = root;
    for (const seg of abs.split("/").filter(Boolean)) {
      if (node.type !== "dir" || !node.children[seg]) return null;
      node = node.children[seg];
    }
    return node;
  };

  return {
    home: HOME,
    pwd: () => cwd,
    display: () => (cwd === HOME ? "~" : cwd.startsWith(HOME + "/") ? "~" + cwd.slice(HOME.length) : cwd),
    resolve: norm,
    get,
    cd(p = "~") {
      const target = norm(p);
      const n = get(target);
      if (!n) return `cd: ${p}: No such file or directory`;
      if (n.type !== "dir") return `cd: ${p}: Not a directory`;
      cwd = target;
      return null;
    },
    list(p = ".", all = false) {
      const n = get(p);
      if (!n) return null;
      if (n.type === "file") return [{ name: p.split("/").pop() || p, dir: false }];
      return Object.entries(n.children)
        .filter(([name]) => all || !name.startsWith("."))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, child]) => ({ name, dir: child.type === "dir" }));
    },
    touch(p: string) {
      const abs = norm(p);
      const parent = get(abs.split("/").slice(0, -1).join("/") || "/");
      const name = abs.split("/").pop();
      if (!parent || parent.type !== "dir" || !name) return `touch: cannot touch '${p}': No such file or directory`;
      if (!parent.children[name]) parent.children[name] = file("");
      return null;
    },
    /** Names in a directory for tab completion, dirs suffixed with '/'. */
    names(partial: string) {
      const slash = partial.lastIndexOf("/");
      const base = slash >= 0 ? partial.slice(0, slash + 1) : "";
      const n = get(base || ".");
      if (!n || n.type !== "dir") return [];
      return Object.entries(n.children).map(([name, c]) => base + name + (c.type === "dir" ? "/" : ""));
    },
  };
}

export interface VFS {
  home: string;
  pwd: () => string;
  display: () => string;
  resolve: (p: string) => string;
  get: (p: string) => Node | null;
  cd: (p?: string) => string | null;
  list: (p?: string, all?: boolean) => { name: string; dir: boolean }[] | null;
  touch: (p: string) => string | null;
  names: (partial: string) => string[];
}
