# CBOR Test Quick Reference

Quick reference for reading and writing CBOR byte assertions in `src/cbor/cbor.test.ts`.

Every CBOR value starts with an **initial byte**: high 3 bits = major type, low 5 bits = argument.

- Values 0–23 fit directly in the low 5 bits.
- Value 24 means "read the next 1 byte" for the argument.
- Value 25 means "read the next 2 bytes" for the argument.

---

## 1. Text string

Base byte: `0x60`. Argument = string length in bytes.

```
0x65,                    // text(5)
...te.encode("hello"),   // "hello"
```

When the length exceeds 23, it spills into the next byte:

```
0x78, 0x18,              // text(24)
...te.encode("..."),     // 24-character string content
```

> Byte strings use the same length rules with base byte `0x40` instead of `0x60`.

---

## 2. Integer

**Unsigned** — base `0x00`:

```
0x01,       // unsigned(1)
0x17,       // unsigned(23) — largest single-byte value
0x18, 0x18, // unsigned(24) — spills into next byte
```

**Negative** — base `0x20`, encoded as `-1 - n`:

```
0x20,       // negative(-1)   → -1 - 0
0x38, 0x63, // negative(-100) → -1 - 99
```

---

## 3. Booleans and null

Base byte: `0xe0` (major type 7, simple values).

```
0xf4, // false
0xf5, // true
0xf6, // null
```

---

## 4. Tag

Base byte: `0xc0`. Argument = tag number. Always followed by exactly one content item.

```
0xc0,             // tag(0)
0xd8, 0x18,       // tag(24)   — 1-byte tag number
0xd9, 0x03, 0xec, // tag(1004) — 2-byte tag number
```

The tagged content follows immediately after the tag bytes:

```
0xc0,                                     // tag(0)
0x74,                                     // text(20)
...te.encode("2024-01-15T12:00:00Z"),     // tagged content
```

---

## 5. Map

Base byte: `0xa0`. Argument = number of entries. Key-value pairs follow in insertion order.

```
0xa1,                    // map(1)
0x66,                    // text(6)
...te.encode("signed"),  // key content
0xc0,                    // tag(0)     ← value starts here
0x74,                    // text(20)
...te.encode("2024-01-15T12:00:00Z"),
```

> Note: maps preserve insertion order — ISO 18013-5 does not require key sorting.

---

## 6. Array

Base byte: `0x80`. Argument = item count. Items follow sequentially.

```
0x83, // array(3)
0x01, // 1
0x02, // 2
0x03, // 3
```

---

## Tag helpers

The CBOR module exposes three tag helpers. Each wraps a value with the appropriate CBOR tag number.

### `tdate(date: Date)` — Tag 0

Encodes a `Date` as a seconds-precision RFC 3339 UTC string (no fractional seconds, as required by ISO 18013-5).

```typescript
tdate(new Date("2024-01-15T12:00:00Z"));
// produces TaggedValue { tagNumber: 0, contents: "2024-01-15T12:00:00Z" }
```

Encoded bytes: `0xc0 0x74` + 20 bytes of UTF-8 text.

### `fullDate(date: string)` — Tag 1004

Accepts a `"YYYY-MM-DD"` string directly. Throws `MdocBuilderError` if the format is invalid. This avoids timezone footguns — Tag 1004 represents a calendar date with no time component.

```typescript
fullDate("2024-01-15");
// produces TaggedValue { tagNumber: 1004, contents: "2024-01-15" }
```

Encoded bytes: `0xd9 0x03 0xec 0x6a` + 10 bytes of UTF-8 text.

### `embeddedCbor(bytes: Uint8Array)` — Tag 24

Wraps raw bytes as an embedded CBOR data item (bstr-wrapped CBOR).

```typescript
embeddedCbor(new Uint8Array([0xa1, 0x01, 0x02]));
// produces TaggedValue { tagNumber: 24, contents: Uint8Array }
```

Encoded bytes: `0xd8 0x18 0x43` + raw bytes.

---

## Adding a new test

### Step 1 — Write the diagnostic notation for your value

Figure out what you want to encode, in CBOR diagnostic notation:

```
{"signed": 0("2024-01-15T12:00:00Z")}
```

### Step 2 — Get the expected bytes from cbor.me

Go to https://cbor.me and paste the diagnostic notation into the right-hand panel. The left panel shows the resulting hex bytes — use these as your expected value.

### Step 3 — Write the test

```typescript
it("encodes a map with a tagged date value", () => {
  const map = new Map<string, unknown>([
    ["signed", tdate(new Date("2024-01-15T12:00:00Z"))],
  ]);
  const encoded = encode(map);

  const te = new TextEncoder();
  const expected = new Uint8Array([
    0xa1, // map(1)
    0x66, // text(6)
    ...te.encode("signed"),
    0xc0, // tag(0)
    0x74, // text(20)
    ...te.encode("2024-01-15T12:00:00Z"),
  ]);

  expect(encoded).toEqual(expected);
});
```
