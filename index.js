module.exports = function(t) {
  return function mergeTypes(types) {
    var fields = {};

    for (var i=0;i<types.length;i++) {
      if (types[i].meta.kind !== "struct") {
        throw new Error("each type should be a struct");
      }

      for (var k in types[i].meta.props) {
        if (!fields[k]) {
          fields[k] = types[i].meta.props[k];

          continue;
        }

        var leftType = fields[k];
        var leftMaybe = false;
        while (leftType.meta.kind === "maybe") {
          leftMaybe = true;
          leftType = leftType.meta.type;
        }
        var leftMeta = leftType.meta;

        var rightType = types[i].meta.props[k];
        var rightMaybe = false;
        while (rightType.meta.kind === "maybe") {
          rightMaybe = true;
          rightType = rightType.meta.type;
        }
        var rightMeta = rightType.meta;

        if (leftMeta.kind !== rightMeta.kind) {
          throw new Error("left and right kinds don't match (" + leftMeta.kind + " vs " + rightMeta.kind + ")");
        }

        if (leftMeta.kind === "irreducible") {
          if (leftMeta.name !== rightMeta.name) {
            throw new Error("irreducible types don't match (" + leftMeta.name + " vs " + rightMeta.name + ")");
          }

          fields[k] = leftType;

          if (leftMaybe && rightMaybe) {
            fields[k] = t.maybe(fields[k]);
          }

          continue;
        }

        if (leftMeta.kind === "struct") {
          fields[k] = mergeTypes([
            leftType,
            rightType,
          ]);

          if (leftMaybe && rightMaybe) {
            fields[k] = t.maybe(fields[k]);
          }

          continue;
        }

        if (leftMeta.kind === "list") {
          fields[k] = t.list(mergeTypes([
            leftType.meta.type,
            rightType.meta.type,
          ]));

          if (leftMaybe && rightMaybe) {
            fields[k] = t.maybe(fields[k]);
          }

          continue;
        }

        throw new Error("unhandled kind: " + leftMeta.kind);
      }
    }

    return t.struct(fields);
  };
};
