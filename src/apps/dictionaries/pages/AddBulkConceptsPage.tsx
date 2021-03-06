import React, { useState } from 'react'
import { Button, createStyles, Grid, makeStyles, Menu, MenuItem, TextField, Theme, Typography } from '@material-ui/core'
import { recursivelyAddConceptsToDictionaryAction } from '../redux'
import { useLocation } from 'react-router'
import { connect } from 'react-redux'
import { PREFERRED_SOURCES, useAnchor, useQuery } from '../../../utils'
import Header from '../../../components/Header'
import { Link } from 'react-router-dom'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    buttonWrapper: {
      textAlign: "center",
      marginTop: "2vh"
    },
    lightColour: {
      color: theme.palette.background.default
    },
  })
);

interface Props {
  addConceptsToDictionary: (...args: Parameters<typeof recursivelyAddConceptsToDictionaryAction>) => void;
}

const AddBulkConceptsPage: React.FC<Props> = ({ addConceptsToDictionary }) => {
  const classes = useStyles();
  const { pathname: url } = useLocation();
  const {fromSource} = useQuery();

  const [switchSourceAnchor, handleSwitchSourceClick, handleSwitchSourceClose] = useAnchor();

  const dictionaryUrl = url.replace("/add", "");
  const [conceptsToAdd, setConceptsToAdd] = useState<string[]>([]);

  return (
    <Header
      title="Add bulk concepts"
      headerComponent={(
        <>
          <Button className={classes.lightColour} variant="text" size="large" aria-haspopup="true" onClick={handleSwitchSourceClick}>
            Switch source (Currently {fromSource})
          </Button>
          <Menu
            anchorEl={switchSourceAnchor}
            keepMounted
            open={Boolean(switchSourceAnchor)}
            onClose={handleSwitchSourceClose}
          >
            {Object.entries(PREFERRED_SOURCES).map(([sourceName, sourceUrl]) => (
              <MenuItem onClick={handleSwitchSourceClose}>
                <Link
                  className="link"
                  to={`${url}?fromSource=${sourceName}`}
                >
                  {sourceName}
                </Link>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    >
      <Grid item xs={6}>
        <Typography align="center">
          Please provide IDs for the {fromSource} concepts to add. IDs should be separated
          with a space, comma or new lines. For example, you can copy and paste
          from a spreadsheet column. e.g 1000, 1001, 1002.
        </Typography>
        <br />
        <TextField
          onChange={e => setConceptsToAdd(e.target.value.split(/[\s,\r\n]+/))}
          fullWidth
          multiline
          rows={20}
          variant="outlined"
        />
        <br />
        <div className={classes.buttonWrapper}>
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            disabled={conceptsToAdd.length < 1}
            onClick={() => {
              setConceptsToAdd([]);
              addConceptsToDictionary(PREFERRED_SOURCES[fromSource], dictionaryUrl, conceptsToAdd, true);
            }}
          >
            Add concepts
          </Button>
        </div>
      </Grid>
    </Header>
  );
};

const mapActionsToProps = {
  addConceptsToDictionary: recursivelyAddConceptsToDictionaryAction
};

export default connect(undefined, mapActionsToProps)(AddBulkConceptsPage);
