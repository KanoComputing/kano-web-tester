<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Web tester</title>
        <link rel="shortcut icon" href="${FAVICON}" type="image/x-icon">
        <link rel="icon" href="${FAVICON}" type="image/x-icon">
        <link rel="stylesheet" href="${MOCHA_CSS}"></link>
    </head>
    <body>
        <div id="mocha"></div>
        <script type="module">
            import { loadTests } from '${IMPORT}';
            loadTests(${TESTS}, ${MOCHA_OPTS});
        </script>
    </body>
</html>