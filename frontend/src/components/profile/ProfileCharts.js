import { useState, useEffect, useRef } from "react";
import LineChart from "../Charts/LineChart";
import Select from "react-select";
import { useAuthContext } from "../../context/AuthProvider";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import SelectBox from "../SelectBox";

const ProfileCharts = () => {
  const OTHERS_OPTION = {
    label: "Others",
    value: "Others",
  };

  var options = [
    { value: "Spring", label: "Spring" },
    { value: "Summer", label: "Summer" },
    { value: "Autumn", label: "Autumn" },
    { value: "Winter", label: "Winter" },
    { ...OTHERS_OPTION, isHidden: true },
  ];

  const [gameModeOptions, setGameModeOptions] = useState([]);
  const [songOptions, setSongOptions] = useState([]);
  const [scores, setScores] = useState();
  const [dates, setDates] = useState();
  const [lineChartData, setLineChartData] = useState([]);
  const [selectedGameMode, setSelectedGameMode] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [scoreMap, setScoreMap] = useState(new Map());
  const [bestScore, setBestScore] = useState();
  const [bestAccuracy, setBestAccuracy] = useState();
  const [bestCompletion, setBestCompletion] = useState();
  const [bestTimeOffset, setBestTimeOffset] = useState();
  const [avgScore, setAvgScore] = useState();
  const [avgAccuracy, setAvgAccuracy] = useState();
  const [avgCompletion, setAvgCompletion] = useState();
  const [avgTimeOffset, setAvgTimeOffset] = useState();
  const axios = useAxiosPrivate();
  const { auth } = useAuthContext();
  const errRef = useRef();
  const [regMsg, setRegMsg] = useState("");

  // clear error message on username, password, email, or passwordMatch change
  useEffect(() => {
    setRegMsg("");
  }, [gameModeOptions, songOptions]);

  /* sets the game mode options based on get request */
  const getGameModes = (data) => {
    let gameModeArray = [];
    data.map((x) => {
      if (x.gameModeActorName === "Custom" && x.customGameModeName !== "") {
        return gameModeArray.push({
          value: x.customGameModeName,
          label: x.customGameModeName,
        });
      } else {
        return gameModeArray.push({
          value: x.gameModeActorName,
          label: x.gameModeActorName,
        });
      }
    });
    setGameModeOptions(getUnique(gameModeArray));
  };

  /* sets the song options based on get request */
  const getSongTitles = (data) => {
    let songTitleArray = [];
    data.map((x) =>
      songTitleArray.push({
        value: x.songTitle,
        label: x.songTitle,
      })
    );
    setSongOptions(getUnique(songTitleArray));
  };

  /* returns a unique array so duplicates aren't displayed in dropdowns */
  const getUnique = (data) => {
    let tempArray = [];
    let unique = data.filter((element) => {
      let isDupe = tempArray.includes(element.value);
      if (!isDupe) {
        tempArray.push(element.value);
        return true;
      }
      return false;
    });
    return unique;
  };

  /* initial useEffect that fetches player data
   * and calls functions to populate the options dropdowns */
  useEffect(() => {
    const initializeOptions = async () => {
      try {
        const response = await axios.get(
          `/api/profile/${auth.username}/getscores`,
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );
        if (response) {
          const responseData = await response.data;
          setLineChartData(responseData);
          getGameModes(responseData);
          getSongTitles(responseData);
        }
      } catch (err) {
        if (!err?.response) {
          console.log(err.response);
          setRegMsg("No Server Response. Try to Reload the page");
        } else if (err.response?.status === 400) {
          console.log(err.response.data.toString());
          setRegMsg("Unauthorized");
        } else if (err.response?.status === 401) {
          console.log(Object.values(err.response.data)[0].toString());
          setRegMsg("Couldn't retrieve data");
        } else {
          setRegMsg("Couldn't retrieve data");
        }
      }
    };
    initializeOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* updates the charts and info boxes when selected gamemode or song changes */
  useEffect(() => {
    const getScores = () => {
      setScoreMap(new Map());
      for (let scoreObject in lineChartData) {
        if (
          ((lineChartData[scoreObject].customGameModeName === "" &&
            lineChartData[scoreObject].gameModeActorName ===
              selectedGameMode) ||
            (lineChartData[scoreObject].customGameModeName ===
              selectedGameMode &&
              lineChartData[scoreObject].gameModeActorName === "Custom")) &&
          lineChartData[scoreObject].songTitle === selectedSong
        ) {
          scoreMap.set(lineChartData[scoreObject].time, {
            score: lineChartData[scoreObject].score,
            highScore: lineChartData[scoreObject].highScore,
            accuracy: lineChartData[scoreObject].accuracy,
            completion: lineChartData[scoreObject].completion,
            timeOffset: lineChartData[scoreObject].avgTimeOffset,
          });
        }
      }
      const sortedScoreMap = new Map([...scoreMap].sort());
      const keys = [...sortedScoreMap.keys()];
      const values = [...sortedScoreMap.values()];
      setScores(values);
      setDates(keys);
      setBestScore(
        Math.round(
          (Math.max(...values.map((value) => value.highScore)) * 10) / 10
        )
      );
      setBestAccuracy(
        Math.round(Math.max(...values.map((value) => value.accuracy)) * 1000) /
          10 +
          "%"
      );
      setBestCompletion(
        Math.round(
          Math.max(...values.map((value) => value.completion)) * 1000
        ) /
          10 +
          "%"
      );
      setBestTimeOffset(
        Math.round(
          Math.max(...values.map((value) => value.timeOffset)) * 1000
        ) + " ms"
      );
      setAvgScore(
        Math.round(
          values
            .map((value) => value.score)
            .reduce((p, c, i, a) => p + c / a.length, 0)
        )
      );
      setAvgAccuracy(
        Math.round(
          values
            .map((value) => value.accuracy)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) /
          10 +
          "%"
      );
      setAvgCompletion(
        Math.round(
          values
            .map((value) => value.completion)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) /
          10 +
          "%"
      );
      setAvgTimeOffset(
        Math.round(
          values
            .map((value) => value.timeOffset)
            .reduce((p, c, i, a) => p + c / a.length, 0) * 1000
        ) + " ms"
      );
    };
    getScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameMode, selectedSong]);

  /* searches for score objects matching user selected game mode */
  const handleGameModeSelect = async (newValue) => {
    setSelectedGameMode(newValue);
    var matchingSongTitles = [];
    for (var scoreObject in lineChartData) {
      if (
        lineChartData[scoreObject].gameModeActorName === newValue ||
        lineChartData[scoreObject].customGameModeName === newValue
      ) {
        matchingSongTitles.push({
          value: lineChartData[scoreObject].songTitle,
          label: lineChartData[scoreObject].songTitle,
        });
      }
    }
    setSongOptions(getUnique(matchingSongTitles));
  };

  /* searches for score objects matching user selected song */
  const handleSongSelect = async (newValue) => {
    setSelectedSong(newValue);
    var matchingGameModes = [];
    for (var scoreObject in lineChartData) {
      if (lineChartData[scoreObject].songTitle === newValue) {
        if (matchingGameModes.gameModeActorName === "") {
          matchingGameModes.push({
            value: lineChartData[scoreObject].customGameModeName,
            label: lineChartData[scoreObject].customGameModeName,
          });
        } else {
          matchingGameModes.push({
            value: lineChartData[scoreObject].gameModeActorName,
            label: lineChartData[scoreObject].gameModeActorName,
          });
        }
      }
    }
    setGameModeOptions(getUnique(matchingGameModes));
  };

  const scoreOptions = {
    title: "Score vs Time",
    xAxisTitle: "Date",
    yAxisTitle: "Score (thousands)",
    category: "score",
    bDisplayPercentage: true,
  };
  const accuracyOptions = {
    title: "Accuracy vs Time",
    xAxisTitle: "Date",
    yAxisTitle: "Hit Rate (%)",
    category: "accuracy",
    bDisplayPercentage: false,
  };
  const completionOptions = {
    title: "Average Targets Destroyed",
    xAxisTitle: "Date",
    yAxisTitle: "Completion (%)",
    category: "completion",
    bDisplayPercentage: false,
  };
  const avgTimeOffsetOptions = {
    title: "Average Reaction Time",
    xAxisTitle: "Date",
    yAxisTitle: "Time (ms)",
    category: "avgTimeOffset",
    bDisplayPercentage: false,
  };

  return (
    <>
      <div className="stats-header">
        <h2 className="stats-title">Statistics for {auth.username}</h2>
        <h4>Get started by selecting a game mode or song.</h4>
      </div>
      <p
        ref={errRef}
        className={regMsg ? "errmsg" : "offscreen"}
        aria-live="assertive">
        {regMsg}
      </p>
      <div className="select-best-container">
        <div className="select-container">
          <div className="select-wrapper">
            <p className="select-caption fs-200">GameMode:</p>
            <div className="select-wrapper">
              <SelectBox
                onChange={(newValue) => handleGameModeSelect(newValue.value)}
                placeholder={"Filter by game mode"}
                options={gameModeOptions}
              />
            </div>
          </div>
          <div className="select-wrapper">
            <p className="select-caption fs-200">Song:</p>
            <div className="select-wrapper">
              <SelectBox
                onChange={(newValue) => handleSongSelect(newValue.value)}
                placeholder={"Filter by song"}
                options={songOptions}
              />
            </div>
          </div>
        </div>
        <div
          className={
            selectedGameMode !== "" && selectedSong !== ""
              ? "best-avg-container"
              : "hide"
          }>
          <div className="best-container">
            <ul className="best-list">
              <li className="table-header">
                <h2 className="fs-300 text-light">Best</h2>
              </li>
              <li className="table-row">
                <div className="col col-1">Score:</div>
                <div className="col col-2">{bestScore}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Accuracy:</div>
                <div className="col col-2">{bestAccuracy}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Reaction Time:</div>
                <div className="col col-2">{bestTimeOffset}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Targets Destroyed:</div>
                <div className="col col-2">{bestCompletion}</div>
              </li>
            </ul>
          </div>
          <div className="best-container">
            <ul className="best-list">
              <li className="table-header">
                <h2 className="fs-300 text-light">Average</h2>
              </li>
              <li className="table-row">
                <div className="col col-1">Score:</div>
                <div className="col col-2">{avgScore}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Accuracy:</div>
                <div className="col col-2">{avgAccuracy}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Reaction Time:</div>
                <div className="col col-2">{avgTimeOffset}</div>
              </li>
              <li className="table-row">
                <div className="col col-1">Targets Destroyed:</div>
                <div className="col col-2">{avgCompletion}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div>
        {selectedGameMode !== "" && selectedSong !== "" && (
          <LineChart
            labels={dates}
            data={scores.map((value) => value.score)}
            myOptions={scoreOptions}
          />
        )}
      </div>
      <div>
        {selectedGameMode !== "" && selectedSong !== "" && (
          <LineChart
            labels={dates}
            data={scores.map((value) => value.accuracy)}
            myOptions={accuracyOptions}
          />
        )}
      </div>
      <div>
        {selectedGameMode !== "" && selectedSong !== "" && (
          <LineChart
            labels={dates}
            data={scores.map((value) => value.completion)}
            myOptions={completionOptions}
          />
        )}
      </div>
      <div>
        {selectedGameMode !== "" && selectedSong !== "" && (
          <LineChart
            labels={dates}
            data={scores.map((value) => value.timeOffset)}
            myOptions={avgTimeOffsetOptions}
          />
        )}
      </div>
    </>
  );
};
export default ProfileCharts;
