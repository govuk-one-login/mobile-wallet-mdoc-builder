import { describe, expect, it } from "vitest";
import {
  tdate,
  fullDate,
  embeddedCbor,
  encode,
  decode,
  TaggedValue,
} from "./cbor.js";

describe("TaggedValue", () => {
  it("is constructed with a tag number and contents", () => {
    const tv = new TaggedValue(0, "test");
    expect(tv.tagNumber).toBe(0);
    expect(tv.contents).toBe("test");
  });
});

describe("tdate", () => {
  it("returns a TaggedValue wrapping Tag 0 with an ISO 8601 string", () => {
    const result = tdate(new Date("2024-01-15T12:00:00Z"));
    expect(result.tagNumber).toBe(0);
    expect(result.contents).toBe("2024-01-15T12:00:00Z");
  });

  it("encodes a tdate as Tag 0 with RFC 3339 UTC string", () => {
    const tagged = tdate(new Date("2024-01-15T12:00:00Z"));
    const encoded = encode(tagged);

    // Tag 0 = major type 6, value 0 → 0xc0
    // Text string "2024-01-15T12:00:00Z" (20 chars)
    const dateStr = "2024-01-15T12:00:00Z";
    const textBytes = new TextEncoder().encode(dateStr);

    const expected = new Uint8Array([
      0xc0, // Tag 0
      0x74, // text(20)
      ...textBytes,
    ]);

    expect(encoded).toEqual(expected);
  });
});

describe("fullDate", () => {
  it("returns a TaggedValue wrapping Tag 1004 with a YYYY-MM-DD string", () => {
    const result = fullDate("2024-01-15");
    expect(result.tagNumber).toBe(1004);
    expect(result.contents).toBe("2024-01-15");
  });

  it("encodes as Tag 1004 with date-only string", () => {
    const tagged = fullDate("2024-01-15");
    const encoded = encode(tagged);

    const dateStr = "2024-01-15";
    const textBytes = new TextEncoder().encode(dateStr);

    const expected = new Uint8Array([
      0xd9,
      0x03,
      0xec, // tag(1004)
      0x6a, // text(10)
      ...textBytes,
    ]);

    expect(encoded).toEqual(expected);
  });

  it("throws MdocBuilderError for a full ISO datetime string", () => {
    expect(() => fullDate("2024-01-15T13:45:30Z")).toThrow(
      'fullDate requires a "YYYY-MM-DD" string, received: "2024-01-15T13:45:30Z"',
    );
  });

  it("throws MdocBuilderError for an empty string", () => {
    expect(() => fullDate("")).toThrow(
      'fullDate requires a "YYYY-MM-DD" string, received: ""',
    );
  });

  it("throws MdocBuilderError for a malformed date", () => {
    expect(() => fullDate("15-01-2024")).toThrow(
      'fullDate requires a "YYYY-MM-DD" string, received: "15-01-2024"',
    );
  });

  it("throws MdocBuilderError for a date with extra characters", () => {
    expect(() => fullDate("2024-01-15 ")).toThrow(
      'fullDate requires a "YYYY-MM-DD" string, received: "2024-01-15 "',
    );
  });

  it("throws MdocBuilderError for a date with letters", () => {
    expect(() => fullDate("AAAA-01-15")).toThrow(
      'fullDate requires a "YYYY-MM-DD" string, received: "AAAA-01-15"',
    );
  });
});

describe("embeddedCbor", () => {
  it("returns a TaggedValue wrapping Tag 24", () => {
    const result = embeddedCbor(new Uint8Array([0xa1, 0x01, 0x02]));
    expect(result.tagNumber).toBe(24);
    expect(result.contents).toEqual(new Uint8Array([0xa1, 0x01, 0x02]));
  });

  it("encodes as Tag 24 wrapping bytes as a CBOR bstr", () => {
    const tagged = embeddedCbor(new Uint8Array([0xa1, 0x01, 0x02]));
    const encoded = encode(tagged);

    const expected = new Uint8Array([
      0xd8,
      0x18, // tag(24)
      0x43, // byte string, length 3
      0xa1,
      0x01,
      0x02,
    ]);

    expect(encoded).toEqual(expected);
  });
});

describe("encode", () => {
  describe("strings", () => {
    it("encodes a plain string", () => {
      const encoded = encode("hello");
      const textBytes = new TextEncoder().encode("hello");

      const expected = new Uint8Array([
        0x65, // text(5)
        ...textBytes,
      ]);

      expect(encoded).toEqual(expected);
    });

    it("encodes an empty string", () => {
      const encoded = encode("");

      // Empty text string: major type 3, length 0 → 0x60
      const expected = new Uint8Array([0x60]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("integers", () => {
    it("encodes zero", () => {
      const encoded = encode(0);

      // Unsigned integer 0: major type 0, value 0 → 0x00
      const expected = new Uint8Array([0x00]);

      expect(encoded).toEqual(expected);
    });

    it("encodes positive integer 23 in shortest form", () => {
      const encoded = encode(23);

      // Unsigned integer 23: major type 0, value 23 → 0x17
      // Largest value that fits directly in the 5-bit additional info
      const expected = new Uint8Array([0x17]);

      expect(encoded).toEqual(expected);
    });

    it("encodes positive integer 24 with one-byte argument", () => {
      const encoded = encode(24);

      // Unsigned integer 24: major type 0, additional info 24 → 0x18, value 0x18
      // Smallest value requiring a one-byte argument
      const expected = new Uint8Array([0x18, 0x18]);

      expect(encoded).toEqual(expected);
    });

    it("encodes positive integer 256 with two-byte argument", () => {
      const encoded = encode(256);

      // Unsigned integer 256: major type 0, additional info 25 → 0x19, value 0x0100
      // Smallest value requiring a two-byte argument
      const expected = new Uint8Array([0x19, 0x01, 0x00]);

      expect(encoded).toEqual(expected);
    });

    it("encodes negative integer -1", () => {
      const encoded = encode(-1);

      // Negative integer -1: major type 1, value 0 → 0x20
      const expected = new Uint8Array([0x20]);

      expect(encoded).toEqual(expected);
    });

    it("encodes negative integer -100 with one-byte argument", () => {
      const encoded = encode(-100);

      // Negative integer -100: major type 1, additional info 24 → 0x38, value 99 → 0x63
      const expected = new Uint8Array([0x38, 0x63]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("booleans", () => {
    it("encodes true", () => {
      const encoded = encode(true);

      // Boolean true: major type 7, value 21 → 0xf5
      const expected = new Uint8Array([0xf5]);

      expect(encoded).toEqual(expected);
    });

    it("encodes false", () => {
      const encoded = encode(false);

      // Boolean false: major type 7, value 20 → 0xf4
      const expected = new Uint8Array([0xf4]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("null", () => {
    it("encodes null", () => {
      const encoded = encode(null);

      // Null: major type 7, value 22 → 0xf6
      const expected = new Uint8Array([0xf6]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("byte strings", () => {
    it("encodes a Uint8Array as a CBOR byte string", () => {
      const encoded = encode(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));

      // Byte string of length 4: major type 2, length 4 → 0x44
      // Then raw bytes
      const expected = new Uint8Array([0x44, 0xde, 0xad, 0xbe, 0xef]);

      expect(encoded).toEqual(expected);
    });

    it("encodes an empty Uint8Array as an empty byte string", () => {
      const encoded = encode(new Uint8Array([]));

      // Byte string of length 0: major type 2, length 0 → 0x40
      const expected = new Uint8Array([0x40]);

      expect(encoded).toEqual(expected);
    });

    it("encodes a byte string with one-byte length prefix", () => {
      // 24 bytes requires one-byte length argument
      const bytes = new Uint8Array(24).fill(0xab);
      const encoded = encode(bytes);

      // Byte string, major type 2, additional info 24 → 0x58, length 24 → 0x18
      // Then 24 bytes of 0xab
      const expected = new Uint8Array([0x58, 0x18, ...bytes]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("maps", () => {
    it("preserves insertion order of keys", () => {
      const map = new Map<string, number>([
        ["b", 2],
        ["a", 1],
        ["c", 3],
      ]);
      const encoded = encode(map);

      const expected = new Uint8Array([
        0xa3, // map(3)
        // b: 2
        0x61, // text(1)
        0x62, // "b"
        0x02, // unsigned(2)
        // a: 1
        0x61,
        0x61,
        0x01,
        // c: 3
        0x61,
        0x63,
        0x03,
      ]);

      expect(encoded).toEqual(expected);
    });

    it("encodes a map with MSO-like string keys in insertion order", () => {
      const map = new Map<string, string>([
        ["version", "1.0"],
        ["digestAlgorithm", "SHA-256"],
        ["docType", "org.iso.18013.5.1.mDL"],
        ["status", "active"],
      ]);
      const encoded = encode(map);

      const te = new TextEncoder();

      const expected = new Uint8Array([
        0xa4, // map(4)
        // "version": "1.0"
        0x67, // text(7)
        ...te.encode("version"), // "version"
        0x63, // text(3)
        ...te.encode("1.0"), // "1.0"
        // "digestAlgorithm" → "SHA-256"
        0x6f,
        ...te.encode("digestAlgorithm"),
        0x67,
        ...te.encode("SHA-256"),
        // "docType" → "org.iso.18013.5.1.mDL"
        0x67,
        ...te.encode("docType"),
        0x75,
        ...te.encode("org.iso.18013.5.1.mDL"),
        // "status" → "active"
        0x66,
        ...te.encode("status"),
        0x66,
        ...te.encode("active"),
      ]);

      expect(encoded).toEqual(expected);
    });
  });

  describe("nested structures", () => {
    it("encodes an array of primitives", () => {
      const encoded = encode([1, 2, 3]);

      const expected = new Uint8Array([
        0x83, // array(3)
        0x01, // 1
        0x02, // 2
        0x03, // 3
      ]);

      expect(encoded).toEqual(expected);
    });

    it("encodes a Map with a TaggedValue as a value", () => {
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

    it("encodes an array containing TaggedValue instances", () => {
      const arr = [
        tdate(new Date("2024-01-15T12:00:00Z")),
        fullDate("2024-06-30"),
      ];
      const encoded = encode(arr);

      const te = new TextEncoder();
      const expected = new Uint8Array([
        0x82, // Array, 2 items
        // tdate
        0xc0, // tag(0)
        0x74, // text(20)
        ...te.encode("2024-01-15T12:00:00Z"),

        // fullDate
        0xd9,
        0x03,
        0xec, // tag(1004)
        0x6a, // text(10)
        ...te.encode("2024-06-30"),
      ]);

      expect(encoded).toEqual(expected);
    });

    it("encodes a nested Map within a Map", () => {
      const inner = new Map<string, number>([["x", 1]]);
      const outer = new Map<string, unknown>([["nested", inner]]);
      const encoded = encode(outer);

      const te = new TextEncoder();
      const expected = new Uint8Array([
        0xa1, // outer  map(1)
        0x66, // text(6)
        ...te.encode("nested"),
        0xa1, // inner map(1)
        0x61, // text(1)
        0x78, // x
        0x01, // 1
      ]);

      expect(encoded).toEqual(expected);
    });

    it("encodes a Map with mixed values including TaggedValue and array", () => {
      // Simulates a validityInfo-like structure
      const map = new Map<string, unknown>([
        ["signed", tdate(new Date("2024-01-15T12:00:00Z"))],
        ["validFrom", tdate(new Date("2024-01-15T12:00:00Z"))],
        ["validUntil", tdate(new Date("2025-01-15T12:00:00Z"))],
      ]);
      const encoded = encode(map);

      const te = new TextEncoder();
      const expected = new Uint8Array([
        0xa3, // map(3)

        // "signed": tdate
        0x66, // text(6)
        ...te.encode("signed"),
        0xc0, // tag(0)
        0x74, // text(20)
        ...te.encode("2024-01-15T12:00:00Z"),

        // "validFrom": tdate
        0x69,
        ...te.encode("validFrom"),
        0xc0,
        0x74, // text(20)
        ...te.encode("2024-01-15T12:00:00Z"),

        // "validUntil": tdate
        0x6a,
        ...te.encode("validUntil"),
        0xc0,
        0x74, // text(20)
        ...te.encode("2025-01-15T12:00:00Z"),
      ]);

      expect(encoded).toEqual(expected);
    });
  });
});

describe("decode", () => {
  it("decodes a CBOR-encoded string", () => {
    const encoded = encode("hello");
    const result = decode(encoded);
    expect(result).toBe("hello");
  });

  it("decodes a CBOR-encoded integer", () => {
    const encoded = encode(42);
    const result = decode(encoded);
    expect(result).toBe(42);
  });

  it("decodes a CBOR-encoded boolean", () => {
    const encoded = encode(true);
    const result = decode(encoded);
    expect(result).toBe(true);
  });

  it("decodes a CBOR-encoded null", () => {
    const encoded = encode(null);
    const result = decode(encoded);
    expect(result).toBeNull();
  });

  it("decodes a CBOR-encoded byte string as Uint8Array", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const encoded = encode(bytes);
    const result = decode(encoded) as Uint8Array;
    expect(new Uint8Array(result)).toEqual(bytes);
  });

  it("decodes a CBOR-encoded Map preserving key order", () => {
    const map = new Map<string, number>([
      ["b", 2],
      ["a", 1],
    ]);
    const encoded = encode(map);
    const result = decode(encoded) as Map<string, number>;
    expect(result).toBeInstanceOf(Map);
    expect([...result.keys()]).toEqual(["b", "a"]);
    expect(result.get("b")).toBe(2);
    expect(result.get("a")).toBe(1);
  });

  it("decodes a CBOR-encoded array", () => {
    const encoded = encode([1, 2, 3]);
    const result = decode(encoded);
    expect(result).toEqual([1, 2, 3]);
  });

  it("converts Tag 0 (tdate) to TaggedValue", () => {
    const tagged = tdate(new Date("2024-01-15T12:00:00Z"));
    const encoded = encode(tagged);
    const result = decode(encoded) as TaggedValue;
    expect(result).toBeInstanceOf(TaggedValue);
    expect(result.tagNumber).toBe(0);
    expect(result.contents).toBe("2024-01-15T12:00:00Z");
  });

  it("converts Tag 1004 (fullDate) to TaggedValue", () => {
    const tagged = fullDate("2024-07-24");
    const encoded = encode(tagged);
    const result = decode(encoded) as TaggedValue;
    expect(result).toBeInstanceOf(TaggedValue);
    expect(result.tagNumber).toBe(1004);
    expect(result.contents).toBe("2024-07-24");
  });

  it("converts Tag 24 (embeddedCbor) to TaggedValue with Uint8Array contents", () => {
    const inner = new Uint8Array([0xa1, 0x01, 0x02]);
    const tagged = embeddedCbor(inner);
    const encoded = encode(tagged);
    const result = decode(encoded) as TaggedValue;
    expect(result).toBeInstanceOf(TaggedValue);
    expect(result.tagNumber).toBe(24);
    expect(new Uint8Array(result.contents as Uint8Array)).toEqual(inner);
  });

  it("converts nested Tags within a Map to TaggedValue", () => {
    const map = new Map<string, unknown>([
      ["signed", tdate(new Date("2024-01-15T12:00:00Z"))],
      ["birth_date", fullDate("1990-05-20")],
    ]);
    const encoded = encode(map);
    const result = decode(encoded) as Map<string, unknown>;
    expect(result).toBeInstanceOf(Map);

    const signed = result.get("signed") as TaggedValue;
    expect(signed).toBeInstanceOf(TaggedValue);
    expect(signed.tagNumber).toBe(0);
    expect(signed.contents).toBe("2024-01-15T12:00:00Z");

    const birthDate = result.get("birth_date") as TaggedValue;
    expect(birthDate).toBeInstanceOf(TaggedValue);
    expect(birthDate.tagNumber).toBe(1004);
    expect(birthDate.contents).toBe("1990-05-20");
  });

  it("converts Tags within an array to TaggedValue", () => {
    const arr = [
      tdate(new Date("2024-01-15T12:00:00Z")),
      fullDate("2024-06-30"),
    ];
    const encoded = encode(arr);
    const result = decode(encoded) as TaggedValue[];
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(TaggedValue);
    expect((result[0] as TaggedValue).tagNumber).toBe(0);
    expect(result[1]).toBeInstanceOf(TaggedValue);
    expect((result[1] as TaggedValue).tagNumber).toBe(1004);
  });

  it("roundtrips encode → decode for a complex structure", () => {
    const map = new Map<string, unknown>([
      ["name", "Alice"],
      ["age", 30],
      ["birth_date", fullDate("1994-03-12")],
      ["categories", ["A", "B"]],
    ]);
    const encoded = encode(map);
    const result = decode(encoded) as Map<string, unknown>;

    expect(result.get("name")).toBe("Alice");
    expect(result.get("age")).toBe(30);
    const bd = result.get("birth_date") as TaggedValue;
    expect(bd).toBeInstanceOf(TaggedValue);
    expect(bd.tagNumber).toBe(1004);
    expect(bd.contents).toBe("1994-03-12");
    expect(result.get("categories")).toEqual(["A", "B"]);
  });
});

describe("module boundary", () => {
  it("exports only the public API from the barrel", async () => {
    const cborModule = await import("./index.js");
    const exportedKeys = Object.keys(cborModule).sort();

    expect(exportedKeys).toEqual(
      [
        "TaggedValue",
        "decode",
        "embeddedCbor",
        "encode",
        "fullDate",
        "tdate",
      ].sort(),
    );
  });

  it("does not expose cbor2 Tag type on TaggedValue instances", () => {
    const tv = tdate(new Date("2024-01-01T00:00:00Z"));

    // Consumers should not be able to access internal cbor2 types
    expect(tv).toBeInstanceOf(TaggedValue);
    expect(tv).not.toHaveProperty("tag");
  });

  it("exposes tagNumber and contents on TaggedValue", () => {
    const tv = tdate(new Date("2024-01-01T00:00:00Z"));

    expect(tv.tagNumber).toBe(0);
    expect(tv.contents).toBe("2024-01-01T00:00:00Z");
  });
});
